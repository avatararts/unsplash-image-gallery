import { Component, OnInit, HostListener, ViewEncapsulation, Input } from '@angular/core';
import { GalleryServices } from './gallery.service';
import { ActivatedRoute } from "@angular/router";
import { ImageDetails } from '../models/image-detail.model';
import { PopupService } from '../popup/popup.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'gallery-grid',
  templateUrl: './gallery.component.html',
  styleUrls: ['../../app/app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class GalleryComponent implements OnInit {
  @Input() orderBy: string = '';
  @Input() id: number;
  @Input() showCollectionTitle: boolean = false;
  @Input() showSearch: boolean = false;
  @Input() isHomePage: boolean = false;
  @Input() isCollectionDetailPage: boolean = false;
  @Input() isTrendingPage: boolean = false;
  private photos: any = [];
  private buffer: any = [];
  private collection: any = [];
  private searchQuery: '';
  private pageNo: number = 2;
  private hasFav: number;
  private isShareActive: boolean = false;
  private isSortActive: boolean = false;
  private openedPopupId: string;
  private loadmore: boolean = false;
  private loading: boolean = false;
  private sharePhoto: Observable<any>;


  constructor(
    private route: ActivatedRoute,
    private galleryServices: GalleryServices,
    private popupService: PopupService) {
  }

  ngOnInit() {
    if (this.isHomePage || this.isTrendingPage) {
      this.getRandomImages(this.orderBy);
    }
    else if (this.isCollectionDetailPage) {
      this.id = +this.route.snapshot.params["id"];
      this.getCollectionPhotos(this.id);
    }

    this.galleryServices.currentStatus.subscribe(hasFav => {
      this.hasFav = hasFav;
    });
  }

  setSort() {
    this.toggleSortBy();
    this.getRandomImages(this.orderBy);
  }

  triggerEnter(event: any) {
    if (event.keyCode == 13) {
      this.getSearchResult(this.searchQuery);
    }
  }

  toggleSortBy() {
    this.isSortActive = !this.isSortActive;
    if (this.orderBy == "") {
      this.orderBy = "oldest";
    } else {
      this.orderBy = "";
    }
  }

  shareToggle() {
    this.isShareActive = !this.isShareActive;
  }

  openShareModal(id: string, image: any) {
    this.sharePhoto = this.popupService.openShareModal(id, image);
    this.openedPopupId = id;
  }

  closeModal(id: string) {
    this.isShareActive = this.popupService.closeModal(id);
    this.openedPopupId = '';
  }

  copyText(value: string) {
    this.galleryServices.copyMessage(value);
  }

  @HostListener('document:keyup', ['$event']) handleKeyUp(event) {
    if (event.keyCode === 27) {
      this.closeModal(this.openedPopupId);
    }
  }

  getCollectionPhotos(collectionId: number) {
    this.loading = true;
    //this will fetch collection photos and other details
    this.galleryServices.getCollectionDetails(collectionId).subscribe((data: {}) => {
      this.photos = data;
      this.loading = false;
    })

    //this will fetch collection info but not photos i.e collection name, number of pics etc
    this.galleryServices.getCollectionInfo(collectionId).subscribe((data: {}) => {
      this.collection = data;
      this.loading = false;
    })

  }

  getRandomImages(orderBy: string) {
    this.loading = true;
    this.galleryServices.getRandomImagesService(orderBy).subscribe((data: {}) => {
      this.photos = data;
      this.loading = false;
    });
  }

  getSearchResult(searchQuery: string) {
    this.loading = true;
    this.pageNo = 2;
    this.galleryServices.getSearchedImages(searchQuery).subscribe((data: {}) => {
      if (this.photos.length < 0) {
        this.photos = [];
      }
      this.photos = data;
      this.photos = this.photos.results;
      this.loading = false;
    });
  }

  addFavorite(photo: any) {
    var favImage = new ImageDetails;

    favImage.imageURL = photo.urls.small;
    favImage.imageDownloadPath = photo.links.download;
    favImage.imageAlt = photo.user.username;
    favImage.imageId = photo.id;
    favImage.imageOwnerProfile = photo.user.profile_image.small;
    favImage.imageOwnerName = photo.user.first_name;

    this.galleryServices.addToLocalStorage(favImage);
    this.galleryServices.changeStatus();
    favImage = null;
  }

  @HostListener("window:scroll", ['$event'])
  onWindowScroll() {
    let pos = window.innerHeight + window.scrollY;
    let max = document.body.offsetHeight;

    if (pos >= max) {
      if (this.isHomePage || this.isTrendingPage) {
        this.loadMoreImages(this.pageNo, this.searchQuery, this.orderBy);
      }
      else if (this.isCollectionDetailPage) {
        this.loadMoreCollections(this.pageNo, this.id);
      }
    }
  }

  loadMoreImages(pages: number, search: string, orderBy: string) {
    this.loadmore = true;
    this.galleryServices.getLoadMoreImages(pages, search, orderBy).subscribe((data: {}) => {
      this.buffer = data;
      if (!this.buffer.results) {
        this.photos = this.photos.concat(data);
      }
      else {
        this.photos = this.photos.concat(this.buffer.results);
      }
      this.pageNo++;
      this.loadmore = false;
    });
  }

  loadMoreCollections(pages: any, id: number) {
    this.loadmore = true;
    this.galleryServices.getLoadMoreCollectionDetailImages(pages, id).subscribe((data: {}) => {
      this.buffer = data;
      this.photos = this.photos.concat(data);
      this.pageNo++;
      this.loadmore = false;
    });
  }
} 

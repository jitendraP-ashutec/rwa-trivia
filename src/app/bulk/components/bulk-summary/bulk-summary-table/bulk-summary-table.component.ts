import { Component, Input, ViewChild, OnChanges, Output, EventEmitter, OnInit, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState, appState, categoryDictionary } from '../../../../store';
import { bulkState } from '../../../store';
import { BulkUploadFileInfo, Category, User } from '../../../../model';
import { Subscription } from 'rxjs/Subscription';
import { MatPaginator, MatTableDataSource, MatSort } from '@angular/material';
import { Sort } from '@angular/material';
import { AngularFireStorage } from 'angularfire2/storage';
import * as bulkActions from '../../../store/actions';

@Component({
  selector: 'bulk-summary-table',
  templateUrl: './bulk-summary-table.component.html',
  styleUrls: ['./bulk-summary-table.component.scss']
})
export class BulkSummaryTableComponent implements OnInit, OnChanges {

  categoryDictObs: Observable<{ [key: number]: Category }>;
  categoryDict: { [key: number]: Category };
  user: User;
  bulkUploadObs: Observable<BulkUploadFileInfo[]>;
  dataSource: any;

  bulkUploadFileInfo: BulkUploadFileInfo;
  isAdminUrl = false;


  displayedColumns = ['archive', 'uploadDate', 'fileName', 'category',
    'primaryTag', 'countQuestionsUploaded', 'countQuestionsApproved', 'countQuestionsRejected', 'status'];

  @Input() bulkSummaryDetailPath: String;
  @Input() showSummaryTable: boolean;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() showBulkUploadBtn = new EventEmitter<String>();
  @Output() showArchive = new EventEmitter<Boolean>();
  @Input() isArchiveBtnClicked: boolean;
  @Input() toggleValue: boolean;
  archivedArray = [];

  constructor(
    private store: Store<AppState>,
    private storage: AngularFireStorage) {
    this.categoryDictObs = store.select(categoryDictionary);
    this.categoryDictObs.subscribe(categoryDict => this.categoryDict = categoryDict);
    this.store.select(appState.coreState).take(1).subscribe((s) => {
      this.user = s.user
    });

    this.store.select(bulkState).select(s => s.bulkUploadFileUrl).subscribe((url) => {
      if (url) {
        const link = document.createElement('a');
        document.body.appendChild(link);
        link.href = url;
        link.click();
        this.store.dispatch(new bulkActions.LoadBulkUploadFileUrlSuccess(undefined));
      }
    });

    this.store.select(bulkState).select(s => s.bulkUploadArchiveStatus).subscribe((state) => {
      if (state === 'ARCHIVED') {
        this.archivedArray = [];
        this.showArchive.emit(false);
      }
    });

  }

  ngOnInit() {
    if (this.bulkSummaryDetailPath && this.showSummaryTable) {
      this.loadBulkSummaryData();
    }
  }
  ngOnChanges(changes: SimpleChanges) {
    if (this.isArchiveBtnClicked) {
      this.store.dispatch(new bulkActions.ArchiveBulkUpload({ archiveArray: this.archivedArray, user: this.user }));
    }

    if (changes['toggleValue'] && changes['toggleValue'].currentValue !== undefined
      && changes['toggleValue'].currentValue !== changes['toggleValue'].previousValue) {

      this.store.dispatch((this.isAdminUrl) ?
        new bulkActions.LoadBulkUpload({ archive: this.toggleValue }) :
        new bulkActions.LoadUserBulkUpload({ user: this.user, archive: this.toggleValue }));
    }
  }

  loadBulkSummaryData() {
    this.isAdminUrl = this.bulkSummaryDetailPath.includes('admin') ? true : false;
    this.store.dispatch((this.isAdminUrl) ?
      new bulkActions.LoadBulkUpload({ archive: this.isArchiveBtnClicked ? false : this.toggleValue ? true : false })
      : new bulkActions.LoadUserBulkUpload(
        { user: this.user, archive: this.isArchiveBtnClicked ? false : this.toggleValue ? true : false }));
    this.bulkUploadObs = this.store.select(bulkState).select((this.bulkSummaryDetailPath.includes('admin'))
      ? s => s.bulkUploadFileInfos : s => s.userBulkUploadFileInfos);

    this.bulkUploadObs.subscribe(bulkUploadFileInfos => {
      if (bulkUploadFileInfos && bulkUploadFileInfos.length !== 0) {
        for (const key in bulkUploadFileInfos) {
          if (bulkUploadFileInfos[key]) {
            if (this.categoryDict[bulkUploadFileInfos[key].categoryId] !== undefined) {
              bulkUploadFileInfos[key].category = this.categoryDict[bulkUploadFileInfos[key].categoryId].categoryName;
            }
          }
        }
        this.dataSource = new MatTableDataSource<BulkUploadFileInfo>(bulkUploadFileInfos);
        this.setPaginatorAndSort();
      }
    });

    // add conditional columns in table
    if (this.isAdminUrl) {
      if (this.displayedColumns.indexOf('created') === -1) {
        this.displayedColumns.push('created')
      }
    }
    if (this.displayedColumns.indexOf('download') === -1) {
      this.displayedColumns.push('download')
    }
  }

  setPaginatorAndSort() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // get Questions by bulk upload Id
  getBulkUploadQuestions(row: BulkUploadFileInfo) {
    this.bulkUploadFileInfo = row;
    this.showBulkUploadBtn.emit('Bulk Upload File Details');
  }

  downloadFile(bulkUploadFileInfo: BulkUploadFileInfo) {
    this.store.dispatch(new bulkActions.LoadBulkUploadFileUrl({ bulkUploadFileInfo: bulkUploadFileInfo }));

  }
  checkedRow(bulkObj) {
    const isCheck = this.archivedArray.filter(item => item === bulkObj)[0];
    if (isCheck !== undefined) {
      this.archivedArray.splice(this.archivedArray.indexOf(bulkObj), 1);
    } else {
      this.archivedArray.push(bulkObj);
    }
    if (this.archivedArray.length > 0) {
      this.showArchive.emit(true);
    } else {
      this.showArchive.emit(false);
    }
  }



}

import { Component, OnDestroy, ViewChild, Input, Output, EventEmitter, OnChanges,
  ViewChildren, QueryList, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { Store, select } from '@ngrx/store';
import { RouterExtensions } from 'nativescript-angular/router';
import { Utils } from 'shared-library/core/services';
import { AppState, appState } from '../../../store';
import { QuestionActions } from 'shared-library/core/store/actions/question.actions';
import { Question, Answer } from 'shared-library/shared/model';
import { QuestionAddUpdate } from './question-add-update';
import { debounceTime, map } from 'rxjs/operators';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { TokenModel } from 'nativescript-ui-autocomplete';
import { RadAutoCompleteTextViewComponent } from 'nativescript-ui-autocomplete/angular';
import * as Toast from 'nativescript-toast';
import { Page, isAndroid } from 'tns-core-modules/ui/page';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe';
import * as imagepicker from 'nativescript-imagepicker';
import * as dialogs from 'ui/dialogs';
import * as imageSourceModule from 'tns-core-modules/image-source';

@Component({
  selector: 'app-question-add-update',
  templateUrl: './question-add-update.component.html',
  styleUrls: ['./question-add-update.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

@AutoUnsubscribe({ 'arrayName': 'subscriptions' })
export class QuestionAddUpdateComponent extends QuestionAddUpdate implements OnDestroy, OnChanges {

  showSelectCategory = false;
  showSelectTag = false;
  dataItem;
  customTag: string;
  private tagItems: ObservableArray<TokenModel>;
  categoryIds: any[];
  submitBtnTxt: string;
  actionBarTxt: string;
  subscriptions = [];
  @Input() editQuestion: Question;
  @Output() hideQuestion = new EventEmitter<boolean>();
  @ViewChild('autocomplete') autocomplete: RadAutoCompleteTextViewComponent;
  @ViewChildren('textField') textField: QueryList<ElementRef>;
  questionImage: { image: any } = { image: '' };
  questionImageFile: any;

  get dataItems(): ObservableArray<TokenModel> {
    return this.tagItems;
  }


  // Constructor
  constructor(public fb: FormBuilder,
    public store: Store<AppState>,
    public utils: Utils,
    public questionAction: QuestionActions,
    private routerExtension: RouterExtensions,
    private page: Page, private cd: ChangeDetectorRef) {

    super(fb, store, utils, questionAction);

    this.submitBtnTxt = 'SUBMIT';
    this.actionBarTxt = 'Submit Question';
    this.initDataItems();
    this.question = new Question();
    this.subscriptions.push(this.store.select(appState.coreState).pipe(select(s => s.applicationSettings)).subscribe(appSettings => {
      if (appSettings) {
        this.applicationSettings = appSettings[0];
        this.createForm(this.question);
      }
      this.cd.markForCheck();
    })
    );


    const questionControl = this.questionForm.get('questionText');

    this.subscriptions.push(questionControl.valueChanges.pipe(debounceTime(500)).subscribe(v => this.computeAutoTags()));
    this.subscriptions.push(this.answers.valueChanges.pipe(debounceTime(500)).subscribe(v => this.computeAutoTags()));

    this.subscriptions.push(store.select(appState.coreState).pipe(select(s => s.questionSaveStatus)).subscribe((status) => {
      if (status === 'SUCCESS') {
        this.store.dispatch(this.questionAction.resetQuestionSuccess());
        Toast.makeText('Question saved!').show();
        this.routerExtension.navigate(['/my/questions']);
        this.actionBarTxt = 'My Question';
        setTimeout(() => {
          this.hideQuestion.emit(false);
          this.toggleLoader(false);
        }, 0);
      }
      this.cd.markForCheck();
    }));
  }

  ngOnChanges() {
    if (this.editQuestion && this.applicationSettings) {
      this.createForm(this.editQuestion);
      this.categoryIds = this.editQuestion.categoryIds;
      this.categories = this.categories.map(categoryObj => {
        if (Number(categoryObj.id) === Number(this.categoryIds[0])) {
          categoryObj['isSelected'] = true;
        }
        return categoryObj;
      });
      this.enteredTags = this.editQuestion.tags;
      this.submitBtnTxt = 'RESUBMIT';
      this.actionBarTxt = 'Update Question';
    }


  }

  private initDataItems() {
    this.tagItems = new ObservableArray<TokenModel>();

    for (let i = 0; i < this.tags.length; i++) {
      this.tagItems.push(new TokenModel(this.tags[i], undefined));
    }
  }


  createForm(question: Question) {

    const answersFA: FormArray = super.createDefaultForm(question);

    this.questionForm = this.fb.group({
      questionText: [question.questionText,
      Validators.compose([Validators.required, Validators.maxLength(this.applicationSettings.question_max_length)])],
      tags: '',
      answers: answersFA,
      questionImage: [''],
      ordered: [question.ordered],
      explanation: [question.explanation]
    }, { validator: questionFormValidator }
    );
  }


  selectCategory(category) {
    this.categoryIds = [];
    this.categories = this.categories.map(categoryObj => {
      categoryObj.isSelected = false;
      return categoryObj;
    });
    category.isSelected = (!category.isSelected) ? true : false;
    this.categoryIds.push(category.id);
  }

  addCustomTag() {
    this.hideKeyboard();
    super.addTag(this.customTag);
    this.customTag = '';
    this.autocomplete.autoCompleteTextView.resetAutocomplete();
  }

  public onDidAutoComplete(args) {
    this.customTag = args.text;
  }

  public onTextChanged(args) {
    this.customTag = args.text;
  }

  submit() {
    this.hideKeyboard();
    const question: Question = super.onSubmit();
    (this.editQuestion) ? question.id = this.editQuestion.id : '';
    if (question && this.categoryIds.length > 0 && this.enteredTags.length > 2) {
      question.categoryIds = this.categoryIds;
      this.toggleLoader(true);
      // call saveQuestion
      if (this.question.questionImage) {
        question.questionImage = this.question.questionImage;
        question.imageType = this.question.imageType;
        question.croppedImageUrl = this.question.croppedImageUrl;
      }
      this.saveQuestion(question);
    }

  }

  hideKeyboard() {
    this.textField
      .toArray()
      .map((el) => {
        if (isAndroid) {
          el.nativeElement.android.clearFocus();
        }
        return el.nativeElement.dismissSoftInput();
      });
  }

  public onSelectSingleTap(args) {
    const context = imagepicker.create({
      mode: 'single',
    });
    this.startSelection(context);

  }

  public startSelection(context) {
    const that = this;
    context
    .authorize()
    .then(() => {
      return context.present();
    })
    .then((selection) => {
      selection.forEach(function(selected) {
        selected.getImageAsync(source => {
             const selectedImgSource = imageSourceModule.fromNativeSource(source);
             that.questionImageFile = `data:image/jpeg;base64,${selectedImgSource.toBase64String('jpeg', 100)}`;
         });
     });
      dialogs.confirm({
        title: 'Save Image',
        message: 'Are You sure? ',
        okButtonText: 'Yes',
        cancelButtonText: 'No',
      }).then((isTrue) => {
        if (isTrue) {
          this.onSaveTap();
          this.cd.detectChanges();
        } else {
        }
      });
      this.cd.detectChanges();
    }).catch((e) => {
    });
  }



  public onSaveTap() {
    const fileName = `${new Date().getTime()}-test.jpeg`;
    this.question.questionImage = fileName;
    this.question.croppedImageUrl =  this.questionImageFile;
    this.question.imageType = 'image/jpeg';
    this.questionForm.get('questionImage').setValue(fileName);
    this.questionForm.updateValueAndValidity();
  }

  public onSelecTap(args) {
    this.onSelectSingleTap(args);
  }


  ngOnDestroy() {

  }
}

// Custom Validators
function questionFormValidator(fg: FormGroup): { [key: string]: boolean } {
  const answers: Answer[] = fg.get('answers').value;

  if (answers.filter(answer => answer.correct).length !== 1) {
    return { 'correctAnswerCountInvalid': true };
  }


}


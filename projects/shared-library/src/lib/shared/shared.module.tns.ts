import { CommonModule } from '@angular/common';
import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import {
  ActionBarComponent,
  DrawerComponent,
  CountryListComponent,
  QuestionsTableComponent,
  QuestionCardComponent,
  FirstQuestionComponent,
  SelectCategoryTagComponent,
  NotificationComponent,
  BottomBarComponent
} from './mobile/component';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { GameFilterPipe } from './pipe/game-filter.pipe';
import { SearchCountryFilterPipe } from './pipe/search-country-filter.pipe';
import { TNSCheckBoxModule } from '@nstudio/nativescript-checkbox/angular';
import { NativeScriptUIAutoCompleteTextViewModule } from 'nativescript-ui-autocomplete/angular';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import {
  RenderQuestionComponent, AuthorComponent, RenderAnswerComponent,
  UserCardComponent, UserReactionComponent, SignupExtraInfoComponent,
  CheckDisplayNameComponent, InviteMailFriendsComponent, FriendInviteComponent, GameInviteComponent,
  RecentGamesComponent, RecentGameCardComponent
} from './components';
import { ShowHintWhenFocusOutDirective, OpenUserProfileDirective, RippleEffectDirective } from './directive';
import { PhoneNumberValidationProvider } from './mobile/component/countryList/phone-number-validation.provider';
import { SafeHtmlPipe } from './pipe/safe-html.pipe';
@NgModule({
  declarations: [
    ActionBarComponent,
    DrawerComponent,
    QuestionsTableComponent,
    AuthorComponent,
    RenderAnswerComponent,
    RenderQuestionComponent,
    CountryListComponent,
    UserCardComponent,
    GameFilterPipe,
    SearchCountryFilterPipe,
    SafeHtmlPipe,
    ShowHintWhenFocusOutDirective,
    OpenUserProfileDirective,
    RippleEffectDirective,
    QuestionCardComponent,
    FirstQuestionComponent,
    InviteMailFriendsComponent,
    SelectCategoryTagComponent,
    UserReactionComponent,
    SignupExtraInfoComponent,
    CheckDisplayNameComponent,
    NotificationComponent,
    FriendInviteComponent,
    GameInviteComponent,
    BottomBarComponent,
    RecentGamesComponent,
    RecentGameCardComponent
  ],
  imports: [
    CommonModule,
    // http client
    HttpClientModule,
    // Forms
    RouterModule,
    HttpClientModule,       // for share counts
    NativeScriptCommonModule,

    NativeScriptFormsModule,
    ReactiveFormsModule,
    TNSCheckBoxModule,
    NativeScriptUIAutoCompleteTextViewModule,
    NativeScriptUIListViewModule,
  ],
  exports: [
    CommonModule,
    HttpClientModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
    TNSCheckBoxModule,
    NativeScriptCommonModule,
    NativeScriptUIAutoCompleteTextViewModule,
    NativeScriptUIListViewModule,
    HttpClientModule,
    ActionBarComponent,
    DrawerComponent,
    QuestionsTableComponent,
    AuthorComponent,
    GameFilterPipe,
    SearchCountryFilterPipe,
    ShowHintWhenFocusOutDirective,
    OpenUserProfileDirective,
    RippleEffectDirective,
    RenderAnswerComponent,
    RenderQuestionComponent,
    QuestionCardComponent,
    FirstQuestionComponent,
    UserCardComponent,
    InviteMailFriendsComponent,
    UserReactionComponent,
    SelectCategoryTagComponent,
    SignupExtraInfoComponent,
    CheckDisplayNameComponent,
    NotificationComponent,
    FriendInviteComponent,
    GameInviteComponent,
    BottomBarComponent,
    RecentGamesComponent,
    RecentGameCardComponent
  ],
  schemas: [NO_ERRORS_SCHEMA],
  entryComponents: [
    CountryListComponent,
    RenderQuestionComponent
  ],
  providers: [
    PhoneNumberValidationProvider
  ]
})
export class SharedModule { }

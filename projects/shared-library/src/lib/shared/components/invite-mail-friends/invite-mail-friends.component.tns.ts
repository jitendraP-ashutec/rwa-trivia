import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Utils } from 'shared-library/core/services';
import { CoreState, UserActions } from 'shared-library/core/store';
import { isIOS } from '@nativescript/core/platform';
import { InviteMailFriends } from './invite-mail-friends';
import { UntilDestroy } from '@ngneat/until-destroy';

declare var IQKeyboardManager;

@Component({
    selector: 'app-invite-mail-friends',
    templateUrl: './invite-mail-friends.component.html',
    styleUrls: ['./invite-mail-friends.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

@UntilDestroy({ arrayName: 'subscriptions' })
export class InviteMailFriendsComponent extends InviteMailFriends implements OnDestroy {
    iqKeyboard: any;
    constructor(fb: FormBuilder, store: Store<CoreState>, userAction: UserActions, cd: ChangeDetectorRef,
        utils: Utils) {
        super(fb, store, userAction, cd, utils);

        if (isIOS) {
            this.iqKeyboard = IQKeyboardManager.sharedManager();
            this.iqKeyboard.shouldResignOnTouchOutside = true;
        }
    }

    hideKeyboard() {
        this.utils.hideKeyboard(this.textField);
    }

    ngOnDestroy(): void {

    }
}

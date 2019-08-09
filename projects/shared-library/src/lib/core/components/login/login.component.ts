import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { CoreState, UIStateActions, coreState } from '../../store';
import { Store } from '@ngrx/store';
import { FirebaseAuthService } from './../../auth/firebase-auth.service';
import { Login } from './login';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe';
import * as firebase from 'firebase/app';
import * as firebaseui from 'firebaseui';
import { WindowRef } from 'shared-library/core/services';
import { CONFIG } from 'shared-library/environments/environment';
import { UserActions } from './../../store/actions';
import { select} from '@ngrx/store';
@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

@AutoUnsubscribe({ 'arrayName': 'subscriptions' })
export class LoginComponent extends Login implements  OnDestroy {
  ui: any;
  uiConfig: any;

  constructor(public fb: FormBuilder,
    public store: Store<CoreState>,
    public dialogRef: MatDialogRef<LoginComponent>,
    private uiStateActions: UIStateActions,
    private firebaseAuthService: FirebaseAuthService,
    public cd: ChangeDetectorRef,
    private windowsRef: WindowRef,
    private userActions: UserActions) {
    super(fb, store, cd);

    this.uiConfig = {
      callbacks: {
        // used this function to return false for do not redirect after success
        signInSuccessWithAuthResult: (authResult, redirectUrl) => false
        },
      autoUpgradeAnonymousUsers: false,
      signInOptions: [
        firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      ],
      signInFlow: 'popup',
      tosUrl: CONFIG.termsAndConditionsUrl,
      privacyPolicyUrl: () =>  windowsRef.nativeWindow.open(CONFIG.privacyUrl, '_blank')
    };
  }

  phoneSignIn() {
    super.phoneSignIn();
      if (!this.ui) {
        this.ui = new firebaseui.auth.AuthUI(firebase.auth());
      }
      this.ui.start('#firebaseui-auth-container', this.uiConfig);
  }

  emailSignIn() {
    if ( this.ui  && this.signInMethod === 'phone') {
      this.ui.reset();
    }
    super.emailSignIn();
  }
  async onSubmit() {
    let user;
    if (!this.loginForm.valid) {
      return;
    }
    try {
      switch (this.mode) {
        case 0:
          // Login
          user = await this.firebaseAuthService.signInWithEmailAndPassword(
            this.loginForm.get('email').value,
            this.loginForm.get('password').value
          );
          if (user) {
            this.dialogRef.close();
          }
          break;
        case 1:
          // Sign up
          user = await this.firebaseAuthService.createUserWithEmailAndPassword(
            this.loginForm.get('email').value,
            this.loginForm.get('password').value
          );
          if (user) {
            this.dialogRef.close();
            if (user && !user.emailVerified) {
              const verifyUser = await this.firebaseAuthService.sendEmailVerification(user);
              if (verifyUser) {
                this.notificationMsg = `email verification sent to ${this.loginForm.get('email').value}`;
                this.errorStatus = false;
              }
            }
          }
          break;
        case 2:
          // Forgot Password
          const isEmailSent = await this.firebaseAuthService.sendPasswordResetEmail(this.loginForm.get('email').value);
          if (isEmailSent) {
            this.notificationMsg = `email sent to ${this.loginForm.get('email').value}`;
            this.errorStatus = false;
            this.notificationLogs.push(this.loginForm.get('email').value);
            this.store.dispatch(this.uiStateActions.saveResetPasswordNotificationLogs(this.notificationLogs));
          }
      }

    } catch ( error ) {
      console.error(error);
      this.notificationMsg = error.message;
      this.errorStatus = true;
      this.cd.markForCheck();
    } finally {
      this.cd.markForCheck();
    }
  }

  googleLogin() {
    this.firebaseAuthService.googleLogin().catch((error: Error) => {
      this.notificationMsg = error.message;
      this.errorStatus = true;
      this.cd.detectChanges();
    });
  }

  fbLogin() {
    this.firebaseAuthService.facebookLogin()
    .then(data => {
        data.user.access_token = data.credential.access_token;
        this.subscriptions.push(this.store.select(coreState).pipe(select(s => s.user)).subscribe(user => {
             this.store.dispatch(this.userActions.updateUser(data.user));
        }));
      })
      .catch((error: Error) => {
        this.notificationMsg = error.message;
        this.errorStatus = true;
         this.cd.detectChanges();
      });
  }

  twitterLogin() {
    this.firebaseAuthService.twitterLogin()
      .catch((error: Error) => {
        this.notificationMsg = error.message;
        this.errorStatus = true;
        this.cd.detectChanges();
      });
  }

  githubLogin() {
    this.firebaseAuthService.githubLogin()
      .catch((error: Error) => {
        this.notificationMsg = error.message;
        this.errorStatus = true;
        this.cd.detectChanges();
      });
  }

  validateLogs() {
    if (this.notificationLogs.indexOf(this.loginForm.get('email').value) !== -1) {
      this.notificationMsg = `Password is sent on your email ${this.loginForm.get('email').value}`;
      return true;
    }
    if (!this.errorStatus) {
      this.notificationMsg = '';
    }
    return false;
  }

  ngOnDestroy() {

  }

}


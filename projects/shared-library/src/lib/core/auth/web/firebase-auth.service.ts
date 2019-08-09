import { Injectable } from '@angular/core';
import { FirebaseAuthService } from './../firebase-auth.service';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material';
import { LoginComponent } from './../../components/login/login.component';
import { WindowRef } from './../../services/windowref.service';


@Injectable()
export class WebFirebaseAuthService implements FirebaseAuthService {

    dialogRef: MatDialogRef<LoginComponent>;
    constructor(protected afAuth: AngularFireAuth,
        public router: Router,
        protected afStore: AngularFirestore,
        public dialog: MatDialog,
        private windowsRef: WindowRef) { }

    authState(): any {
        return this.afAuth.authState;
    }

    public createUserWithEmailAndPassword(email, password) {
        return this.afAuth.auth.createUserWithEmailAndPassword(email, password);
    }

    public getIdToken(user, forceRefresh: boolean) {
        if (this.dialogRef) {
            this.dialogRef.close();
        }
        return user.getIdToken(forceRefresh);
    }

    public refreshToken(forceRefresh: boolean) {
        return firebase.auth().currentUser.getIdToken(forceRefresh);
    }

    public signOut() {
        this.afAuth.auth.signOut();
        this.router.navigate(['dashboard']);
        this.windowsRef.nativeWindow.location.reload();
    }

    public showLogin() {
        this.dialogRef = this.dialog.open(LoginComponent, {
            disableClose: false
        });
    }

    public sendEmailVerification(user): Promise<any> {
        return firebase.auth().currentUser.sendEmailVerification();
    }

    public signInWithEmailAndPassword(email: string, password: string) {
        return this.afAuth.auth.signInWithEmailAndPassword(email, password);
    }

    public firebaseAuth() {
        return this.afAuth.auth;
    }

    public googleLogin(): Promise<any> {
        return this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    }

    public facebookLogin(): Promise<any> {
        const provider = new firebase.auth.FacebookAuthProvider();
        provider.addScope('public_profile,user_friends,email');
        return this.afAuth.auth.signInWithPopup(provider);
    }
    public phoneLogin(phoneNumber): Promise<any> {
        return;
    }

    public twitterLogin(): Promise<any> {
        return this.afAuth.auth.signInWithPopup(new firebase.auth.TwitterAuthProvider());
    }

    public githubLogin(): Promise<any> {
        return this.afAuth.auth.signInWithPopup(new firebase.auth.GithubAuthProvider());
    }

    public sendPasswordResetEmail(email: string) {
        return firebase.auth().sendPasswordResetEmail(email);
    }

    public resumeState(user) {

    }

    public getProvider() {
        return firebase.auth().currentUser.providerData[0];
    }
}

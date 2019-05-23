import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ChangeDetectorRef, Inject, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe';
import { Observable, Subscription, timer } from 'rxjs';
import { Utils, WindowRef } from 'shared-library/core/services';
import { GameActions, QuestionActions, UserActions } from 'shared-library/core/store/actions';
import {
    Account, ApplicationSettings, CalenderConstants, Game, GameStatus, Invitation,
    OpponentType, PlayerMode, User
} from 'shared-library/shared/model';
import { AppState, appState } from '../../../store';

@AutoUnsubscribe({ 'arrayName': 'subscriptions' })
export class Dashboard implements OnDestroy {

    START_A_NEW_GAME = 'Start New Game';
    NEW_GAME_IN = 'New Game In';
    user: User;
    users: User[];
    activeGames$: Observable<Game[]>;
    userDict$: Observable<{ [key: string]: User }>;
    gameSliceStartIndex: number;
    gameSliceLastIndex: number;
    gameInviteSliceStartIndex: number;
    gameInviteSliceLastIndex: number;
    now: Date;
    greeting: string;
    message: string;
    activeGames: Game[];
    showGames: boolean;
    showNewsCard = true;
    userDict: { [key: string]: User } = {};
    missingCardCount = 0;
    numbers = [];
    gameInvites: Game[];
    friendCount = 0;
    randomPlayerCount = 0;
    maxGameCardPerRow: number;
    screenWidth: number;
    friendInvitations: Invitation[] = [];
    friendInviteSliceStartIndex: number;
    friendInviteSliceLastIndex: number;
    isUserLoggedIn: boolean;
    ngZone: NgZone;
    singlePlayerCount: number;
    twoPlayerCount: number;
    theirTurnCount: number;
    waitingForOpponentCount: number;
    timerSub: Subscription;
    utils: Utils;
    account: Account;
    public remainingHours: string;
    public remainingMinutes: string;
    public remaningSeconds: string;
    public timeoutLive: string;
    gamePlayBtnDisabled = true;
    applicationSettings: ApplicationSettings;
    subscriptions = [];
    startGame = this.START_A_NEW_GAME;
    cd: ChangeDetectorRef;
    serverCreatedTime: number;
    appInstallationStatus: boolean;

    constructor(public store: Store<AppState>,
        private questionActions: QuestionActions,
        private gameActions: GameActions,
        private userActions: UserActions, private windowRef: WindowRef,
        @Inject(PLATFORM_ID) private platformId: Object,
        ngZone: NgZone,
        utils: Utils,
        cd: ChangeDetectorRef) {
        this.utils = utils;
        this.ngZone = ngZone;
        this.cd = cd;
        this.serverCreatedTime = this.utils.getUTCTimeStamp();
        this.activeGames$ = store.select(appState.coreState).pipe(select(s => s.activeGames));
        this.userDict$ = store.select(appState.coreState).pipe(select(s => s.userDict));
        this.subscriptions.push(store.select(appState.coreState).pipe(select(s => s.user)).subscribe(user => {
            this.ngZone.run(() => {
                this.user = user;
                this.cd.markForCheck();
                if (!this.user && this.timerSub) {
                    this.timerSub.unsubscribe();
                }
                if (this.user === null) {
                    this.timeoutLive = '';
                    this.cd.markForCheck();
                    this.gamePlayBtnDisabled = false;
                }

                this.subscriptions.push(this.store.select(appState.coreState)
                    .pipe(select(s => s.questionOfTheDay)).subscribe(questionOfTheDay => {
                        if (questionOfTheDay) {
                            this.serverCreatedTime = questionOfTheDay.serverTimeQCreated;
                        }
                    }));

                if (this.user) {
                    this.subscriptions.push(this.store.select(appState.coreState).pipe(select(s => s.applicationSettings))
                        .subscribe(appSettings => {
                            if (appSettings) {
                                this.applicationSettings = appSettings[0];
                                if (this.applicationSettings) {
                                    this.subscriptions.push(store.select(appState.coreState).pipe(select(s => s.account))
                                        .subscribe(account => {
                                            this.account = account;
                                            this.cd.markForCheck();
                                            if (this.account && !this.account.enable) {
                                                this.timeoutLive = '';
                                                if (this.account && this.account.lives === 0 && this.isLivesEnable) {
                                                    this.gamePlayBtnDisabled = true;
                                                } else {
                                                    this.gamePlayBtnDisabled = false;
                                                }
                                            } else {
                                                this.gamePlayBtnDisabled = false;
                                            }
                                            if (this.timerSub) {
                                                this.timerSub.unsubscribe();
                                            }
                                            this.gameLives();
                                        }));
                                    if (!this.applicationSettings.lives.enable) {
                                        this.gamePlayBtnDisabled = false;
                                        if (this.timerSub) {
                                            this.timeoutLive = '';
                                            this.timerSub.unsubscribe();
                                        }
                                    }
                                }
                            }
                        }));
                }
            });
            this.store.dispatch(this.gameActions.getActiveGames(user));
            this.store.dispatch(this.userActions.loadGameInvites(user));
            this.showNewsCard = this.user && this.user.isSubscribed ? false : true;
        }));

        this.subscriptions.push(this.userDict$.subscribe(userDict => this.userDict = userDict));
        this.subscriptions.push(this.activeGames$.subscribe(games => {
            this.activeGames = games;
            this.cd.markForCheck();
            this.singlePlayerCount = 0;
            this.twoPlayerCount = 0;
            this.theirTurnCount = 0;
            this.waitingForOpponentCount = 0;
            if (games.length > 0) {
                if (!(isPlatformBrowser(this.platformId) === false && isPlatformServer(this.platformId) === false)) {
                    this.screenWidth = this.windowRef.nativeWindow.innerWidth;
                    this.checkCardCountPerRow();
                }
                this.activeGames.map(game => {
                    const playerIds = game.playerIds;

                    if (Number(game.gameOptions.playerMode) === Number(PlayerMode.Single) && game.playerIds.length === 1) {
                        this.singlePlayerCount++;
                    }

                    if (game.nextTurnPlayerId !== this.user.userId && game.GameStatus === GameStatus.WAITING_FOR_NEXT_Q) {
                        this.theirTurnCount++;
                    }

                    if (Number(game.gameOptions.playerMode) === Number(PlayerMode.Opponent) &&
                        (game.nextTurnPlayerId === this.user.userId)) {
                        this.twoPlayerCount++;
                    }
                    // tslint:disable-next-line:max-line-length
                    if (game.GameStatus === GameStatus.AVAILABLE_FOR_OPPONENT ||
                        game.GameStatus === GameStatus.JOINED_GAME ||
                        game.GameStatus === GameStatus.WAITING_FOR_FRIEND_INVITATION_ACCEPTANCE
                        || game.GameStatus === GameStatus.WAITING_FOR_RANDOM_PLAYER_INVITATION_ACCEPTANCE) {
                        this.waitingForOpponentCount++;
                    }
                    playerIds.map(playerId => {
                        if (playerId !== this.user.userId) {
                            if (this.userDict[playerId] === undefined) {
                                this.store.dispatch(this.userActions.loadOtherUserProfile(playerId));
                            }

                        }
                    });
                });
                this.showGames = true;
            }
        }));

        this.gameSliceStartIndex = 0;
        this.gameSliceLastIndex = 8;

        this.subscriptions.push(store.select(appState.coreState).pipe(select(s => s.gameInvites)).subscribe(iGames => {
            this.gameInvites = iGames;
            this.friendCount = 0;
            this.randomPlayerCount = 0;
            iGames.map(iGame => {
                if (Number(iGame.gameOptions.opponentType) === OpponentType.Friend) {
                    this.friendCount++;
                } else if (Number(iGame.gameOptions.opponentType) === OpponentType.Random) {
                    this.randomPlayerCount++;
                }
                this.store.dispatch(this.userActions.loadOtherUserProfile(iGame.playerIds[0]));
            });
        }));
        this.gameInviteSliceStartIndex = 0;
        this.gameInviteSliceLastIndex = 3;

        this.subscriptions.push(store.select(appState.coreState).pipe(select(s => s.friendInvitations)).subscribe(invitations => {
            if (invitations.length > 0) {
                this.friendInvitations = invitations;
                invitations.map(invitation => {
                    this.store.dispatch(this.userActions.loadOtherUserProfile(invitation.created_uid));
                });
            }
        }));

        this.friendInviteSliceStartIndex = 0;
        this.friendInviteSliceLastIndex = 3;



    }

    displayMoreGames(): void {
        this.gameSliceLastIndex = (this.activeGames.length > (this.gameSliceLastIndex + 8)) ?
            this.gameSliceLastIndex + 8 : this.activeGames.length;
        this.checkCardCountPerRow();
    }

    displayMoreGameInvites(): void {
        this.gameInviteSliceLastIndex = (this.gameInvites.length > (this.gameInviteSliceLastIndex + 3)) ?
            this.gameInviteSliceLastIndex + 3 : this.gameInvites.length;
    }


    displayMoreFriendInvites(): void {
        this.friendInviteSliceLastIndex = (this.friendInvitations.length > (this.friendInviteSliceLastIndex + 3)) ?
            this.friendInviteSliceLastIndex + 3 : this.friendInvitations.length;
    }

    checkCardCountPerRow() {
        this.numbers = [];
        if (this.screenWidth > 1000 && this.screenWidth < 1200) {
            this.maxGameCardPerRow = 3;
        } else {
            this.maxGameCardPerRow = 4;
        }
        if (this.activeGames.length > 0) {
            if (this.activeGames.length < this.maxGameCardPerRow) {
                this.missingCardCount = this.maxGameCardPerRow - this.activeGames.length;
                this.numbers = Array(this.missingCardCount).fill(0).map((x, i) => i);
            } else if (this.activeGames.length > this.maxGameCardPerRow && this.activeGames.length <= this.gameSliceLastIndex) {
                const diff = Math.trunc(this.activeGames.length / this.maxGameCardPerRow);
                if (this.activeGames.length % this.maxGameCardPerRow !== 0) {
                    this.missingCardCount = (diff + 1) * this.maxGameCardPerRow - this.activeGames.length;
                    this.numbers = Array(this.missingCardCount).fill(0).map((x, i) => i);
                }

            }
        }
    }

    gameLives() {

        const maxMiliSecond = this.utils.convertMilliSIntoMinutes(this.applicationSettings.lives.lives_after_add_millisecond) - 1;
        if (this.account) {
            if (this.account.lives <= this.applicationSettings.lives.max_lives) {
                this.timerSub = timer(1000, 1000).subscribe(t => {
                    this.serverCreatedTime += 1000;
                    const diff = this.utils.getTimeDifference(this.account.lastLiveUpdate, this.serverCreatedTime);
                    const minute = Math.floor(diff % (CalenderConstants.HOURS_CALCULATIONS) / (CalenderConstants.MINUTE_CALCULATIONS));
                    const second = Math.floor(diff / 1000) % 60;
                    const timeStamp = this.serverCreatedTime;

                    if (minute > 0) {
                        this.remainingMinutes = (this.utils.convertIntoDoubleDigit(maxMiliSecond - minute));
                    } else {
                        this.remainingMinutes = (this.utils.convertIntoDoubleDigit(maxMiliSecond));
                    }
                    if (second > 0) {
                        this.remaningSeconds = (this.utils.convertIntoDoubleDigit(59 - second));
                    } else {
                        this.remaningSeconds = (this.utils.convertIntoDoubleDigit(59 - second));
                    }

                    if (timeStamp >= this.account.nextLiveUpdate) {
                        this.timerSub.unsubscribe();
                        // this.timeoutLive = '(' + String(this.account.lives) + ')';
                        this.cd.markForCheck();
                        if (this.user) {
                            this.store.dispatch(this.userActions.addUserLives(this.user.userId));
                        }
                    } else {
                        let timeOut = '';
                        if (this.account.lives !== this.applicationSettings.lives.max_lives) {
                            timeOut = (this.remainingMinutes) + ':' + (this.remaningSeconds);
                        }
                        this.timeoutLive = timeOut;
                        this.cd.markForCheck();
                    }
                });
                this.subscriptions.push(this.timerSub);
            }
        }

    }

    ngOnDestroy(): void {

    }

    get gameStart() {
        if (this.user && this.account && this.account.lives === 0 && this.applicationSettings.lives.enable) {
            this.startGame = this.NEW_GAME_IN;
        } else {
            this.startGame = this.START_A_NEW_GAME;
        }
        // tslint:disable-next-line:max-line-length
        const startString = this.startGame + ((this.user && this.applicationSettings.lives.enable && this.timeoutLive) ? '   |   ' + this.timeoutLive : '');
        this.cd.markForCheck();
        return startString;
    }

    get isLivesEnable(): Boolean {
        const isEnable = (this.user && this.account && this.applicationSettings.lives.enable) ? true : false;
        return isEnable;
    }
}

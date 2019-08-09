import * as firebase from 'firebase/app';
import { GameOptions } from './game-options';
import { Account } from './account';
import { FriendsMetadata } from './friends';
export class User {
  id?: string;
  userId: string;
  name?: string;
  displayName: string;
  location?: string;
  categoryIds?: number[];
  facebookUrl?: string;
  twitterUrl?: string;
  linkedInUrl?: string;
  profilePicture?: string;
  email: string;
  idToken?: string;
  authState: firebase.User;
  roles?: any;
  tags?: string[];
  isSubscribed?: boolean;
  profilePictureUrl?: string;
  stats?: UserStats;
  isRequestedBulkUpload?: boolean;
  bulkUploadPermissionStatus: string;
  bulkUploadPermissionStatusUpdateTime: number;
  croppedImageUrl: any;
  originalImageUrl: any;
  imageType: string;
  androidPushTokens?: string[];
  iosPushTokens?: string[];
  lastGamePlayOption?: GameOptions;
  account?: Account;
  achievements: string[];
  gamePlayed: Array<{ [key: string]: FriendsMetadata }>;
  access_token: string;

  constructor(authState?: firebase.User & { name: string }) {
    if (authState) {
      this.authState = authState;
      this.userId = authState.uid;
      this.email = authState.providerData ? authState.providerData[0].email : authState.email;
      if (authState.providerData && authState.providerData[0].displayName) {
        this.name = authState.providerData[0].displayName;
      } else if (authState.name) {
        this.name = authState.name;
      }
    }
  }
}

export class UserStats {
  leaderBoardStats?: { [key: number]: number };
  gamePlayed?: number;
  categories?: number;
  wins?: number;
  badges?: number;
  losses?: number;
  avgAnsTime?: number;
  contribution?: number;
  constructor() {
    this.leaderBoardStats = {};
  }
}

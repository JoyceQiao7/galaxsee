export type DevvitMessage =
  | { type: 'initialData'; data: { username: string; galaxy: any; inbox: any[] } }
  | { type: 'updateNearby'; data: { nearbyGalaxies: any[] } }
  | { type: 'signalResult'; data: { success: boolean } }
  | { type: 'updateInbox'; data: { inbox: any[] } };

export type WebViewMessage =
  | { type: 'webViewReady' }
  | { type: 'scanSpace' }
  | { type: 'sendSignal'; data: { receiverId: string; message: string } };

export type DevvitSystemMessage = {
  data: { message: DevvitMessage };
  type?: 'devvit-message' | string;
};
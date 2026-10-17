// Stand-in for Web A's src/api/types: the one type that SubTest.tsx imports
export type ApiUpdateAuthorizationStateType = (
  'authorizationStateLoggingOut'
  | 'authorizationStateWaitPhoneNumber'
  | 'authorizationStateWaitCode'
  | 'authorizationStateWaitPassword'
  | 'authorizationStateWaitRegistration'
  | 'authorizationStateReady'
  | 'authorizationStateClosing'
  | 'authorizationStateClosed'
  | 'authorizationStateWaitQrCode'
);

export default {
  ACCOUNT_PROVIDER: {
    EMAIL: 'EMAIL',
    FACEBOOK: 'FACEBOOK',
    GOOGLE: 'GOOGLE',
    TWITTER: 'TWITTER'
  },

  ERROR: {
    WRONG_LOGIN_OR_PASSWORD: 'WRONG_LOGIN_OR_PASSWORD',
    EMAIL_ALREADY_IN_USE: 'EMAIL_ALREADY_IN_USE',
    EMAIL_NOT_IN_USE: 'EMAIL_NOT_IN_USE',
    EMAIL_IS_NOT_CONFIRMED: 'EMAIL_IS_NOT_CONFIRMED',
    USERNAME_ALREADY_IN_USE: 'USERNAME_ALREADY_IN_USE',
    ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    FORBIDDEN: 'FORBIDDEN',
    WRONG_REQUEST: 'WRONG_REQUEST',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',

    ALREADY_VOTED: 'ALREADY_VOTED',
    ALREADY_TAGGED: 'ALREADY_TAGGED',
    ALREADY_MARKED: 'ALREADY_MARKED'
  },

  ACTIVITY_TYPE: {
    QUESTION: 'QUESTION',
    VOTE: 'VOTE',
    TAG: 'TAG',
    COMMENT: 'COMMENT',
    SOMEONE_VOTE: 'SOMEONE_VOTE',
    SOMEONE_TAG: 'SOMEONE_TAG',
    SOMEONE_COMMENT: 'SOMEONE_COMMENT',
    SOMEONE_REPLY: 'SOMEONE_REPLY',
    OTHERS_VOTE_AS_WELL: 'OTHERS_VOTE_AS_WELL'
  },

  VOTE: {
    YES: 1,
    NO: 2
  },

  TAG: {
    UNEXPECTED: 1,
    CHANGE_IN_FUTURE: 2,
    UNFAIR: 3,
    NOT_WHOLE: 4,
    PRETTY_MUCH_TRUE: 5,
    WEIRD: 6,
    EXPECTED: 7
  },

  MARK: {
    SPAM: 1,
    LIKE: 2
  }
}

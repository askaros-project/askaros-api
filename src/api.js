import { Router } from 'express'
import passport from 'passport'
import { jwtLogin } from './services/passport'
import request from './services/request'
import response from './services/response'
import accountRoute from './api/account.route'
import userRoute from './api/user.route'
import questionRoute from './api/question.route'
import activityRoute from './api/activity.route'
import commentRoute from './api/comment.route'
import adminRoute from './api/admin.route'
import mailRoute from './api/mail.route'
import feedbackRoute from './api/feedback.route'

passport.use(jwtLogin)
const fillAuth = (req, res, next) => {
  passport.authenticate(
    'jwt',
    {
      session: false,
      assignProperty: 'account'
    },
    (err, account) => {
      req.account = account
      next()
    }
  )(req, res, next)
}

const isAuth = passport.authenticate('jwt', {
  session: false,
  assignProperty: 'account'
})
const isAdmin = (req, res, next) => {
  if (!req.account.isAdmin) {
    return res.sendError('Forbidden', 403)
  }
  next()
}
const isEnabled = (req, res, next) => {
  if (req.account.isSuspended) {
    return res.sendError('Forbidden', 403)
  }
  next()
}

export function API() {
  const api = Router()

  api.use(request)
  api.use(response)

  // ACCOUNT
  api.get('/account', isAuth, accountRoute.getData)
  api.post('/account/email', accountRoute.emailReg)
  api.post('/account/email/login', accountRoute.emailLogin)
  api.post('/account/email/confirmation/:id', accountRoute.emailConfirmation)
  api.post('/account/facebook/login', accountRoute.facebookLogin)
  api.post('/account/google/login', accountRoute.googleLogin)
  api.post('/account/twitter/login', accountRoute.twitterLogin)

  // USER
  api.put('/user', isAuth, userRoute.update)
  api.post('/user/notifications/:type', isAuth, userRoute.subscribe)
  api.delete('/user/notifications/:type', isAuth, userRoute.unsubscribe)

  // QUESTIONS
  api.get('/questions/search', questionRoute.getSearchQuestions)
  api.get('/questions/profile', isAuth, questionRoute.getProfileQuestions)
  api.get('/questions/random_question', questionRoute.getRandomQuestion)
  api.get('/questions/:id/votes', questionRoute.getVotes)
  api.get('/questions/:uri', fillAuth, questionRoute.getByUri)
  api.get(
    '/questions/collection/all',
    fillAuth,
    questionRoute.getAllCollection
  )
  api.get(
    '/questions/collection/newest',
    fillAuth,
    questionRoute.getNewestCollection
  )
  api.get(
    '/questions/collection/related',
    fillAuth,
    questionRoute.getRelatedCollection
  )
  api.get('/questions/collection/tag', fillAuth, questionRoute.getTagCollection)
  api.get(
    '/questions/collection/trending',
    fillAuth,
    questionRoute.getTrendingCollection
  )
  api.post('/questions', isAuth, isEnabled, questionRoute.create)
  api.post('/questions/:id/vote', isAuth, isEnabled, questionRoute.vote)
  api.post('/questions/:id/tag', isAuth, isEnabled, questionRoute.tag)
  api.post('/questions/:id/mark', isAuth, isEnabled, questionRoute.mark)
  // api.delete('/questions/:id', isAuth, questionsRoute.delete) // added to remove questions, chekc that user can remove only own question

  // ACTIVITY
  api.get('/activity', isAuth, activityRoute.getItems)
  api.get('/activity/count', isAuth, activityRoute.getCount)

  // COMMENTS
  api.get('/comments/:qid', fillAuth, commentRoute.load)
  api.post('/comments', isAuth, isEnabled, commentRoute.add)
  api.put('/comments/:id/marks/:code', isAuth, isEnabled, commentRoute.mark)

  // MAIL LIST
  api.post('/maillist/subscribers', mailRoute.addSubscriber)

  // FEEDBACK
  api.post('/feedback', feedbackRoute.addMessage)

  // ADMIN
  api.get('/admin/accounts', isAuth, isAdmin, adminRoute.getAccounts)
  api.post('/admin/accounts/:id/admin', isAuth, isAdmin, adminRoute.toggleAdmin)
  api.post(
    '/admin/accounts/:id/suspended',
    isAuth,
    isAdmin,
    adminRoute.toggleSuspended
  )
  api.get('/admin/questions', isAuth, isAdmin, adminRoute.getQuestns)
  api.delete('/admin/questions/:id', isAuth, isAdmin, adminRoute.deleteQuestion)
  api.get('/admin/comments', isAuth, isAdmin, adminRoute.getComments)
  api.delete('/admin/comments/:id', isAuth, isAdmin, adminRoute.deleteComment)
  api.get('/admin/mail_lists', isAuth, isAdmin, adminRoute.getMailLists)
  api.get('/admin/mail_campaigns', isAuth, isAdmin, adminRoute.getMailCampaigns)
  api.post(
    '/admin/mail_campaigns',
    isAuth,
    isAdmin,
    adminRoute.createMailCampaign
  )
  api.put(
    '/admin/mail_campaigns/:id',
    isAuth,
    isAdmin,
    adminRoute.updateMailCampaign
  )
  api.post(
    '/admin/mail_campaigns/:id/send',
    isAuth,
    isAdmin,
    adminRoute.sendMailCampaign
  )
  api.delete(
    '/admin/mail_campaigns/:id',
    isAuth,
    isAdmin,
    adminRoute.deleteMailCampaign
  )

  return api
}

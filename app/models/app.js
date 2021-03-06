/* eslint-disable object-shorthand */
import { createAction, NavigationActions, Storage } from '../utils'
import {
  queryUserInfo,
  queryLoginWithCaptcha,
  queryLoginUserInfo,
} from '../services/api'

export default {
  namespace: 'app',
  state: {
    login: false,
    needCaptcha: false,
    loading: true,
    fetching: false,
    loginError: false,
    issues: [],
    domain: null,
    userInfo: null,
    Authorization: null,
    userName: null,
  },
  reducers: {
    updateState(state, { payload }) {
      return { ...state, ...payload }
    },
  },
  effects: {
    *loadStorage(action, { call, put }) {
      const login = yield call(Storage.get, 'login', false)
      const domain = yield call(Storage.get, 'domain', null)
      const userInfo = yield call(Storage.get, 'userInfo', null)
      const Authorization = yield call(Storage.get, 'Authorization', null)
      yield put(
        createAction('updateState')({
          login,
          domain,
          userInfo,
          Authorization,
          loading: false,
        })
      )
    },

    *login({ payload }, { call, put }) {
      yield put(createAction('updateState')({ fetching: true }))
      const resulut = yield call(queryUserInfo, payload)
      if (resulut) {
        if (resulut.loginInfo) {
          const loginUserResult = yield call(queryLoginUserInfo, payload)
          if (loginUserResult) {
            yield put(createAction('updateState')({ loginError: false }))
            Storage.set('userInfo', loginUserResult)
            Storage.set('login', true)
            Storage.set('domain', payload.domain)
            Storage.set('Authorization', payload.headers.Authorization)
            yield put(
              createAction('updateState')({ userName: payload.userName })
            )
          }
        } else if (
          resulut.errorMessages &&
          resulut.errorMessages[0] === 'Login denied'
        ) {
          yield put(
            createAction('updateState')({ loginError: true, needCaptcha: true })
          )
        } else {
          yield put(createAction('updateState')({ loginError: true }))
        }
      } else {
        yield put(createAction('updateState')({ loginError: true }))
      }
      yield put(createAction('updateState')({ fetching: false }))
    },

    *loginWithCaptcha({ payload }, { call, put }) {
      yield put(createAction('updateState')({ fetching: true }))
      const result = yield call(queryLoginWithCaptcha, payload)
      if (result) {
        if (result.url === `${payload.domain}/login.jsp`) {
          yield put(
            createAction('updateState')({ loginError: true, needCaptcha: true })
          )
        } else {
          const loginUserResult = yield call(queryLoginUserInfo, payload)
          if (loginUserResult) {
            yield put(createAction('updateState')({ loginError: false }))
            Storage.set('userInfo', loginUserResult)
            Storage.set('login', true)
            Storage.set('domain', payload.domain)
            Storage.set('Authorization', payload.headers.Authorization)
            yield put(
              createAction('updateState')({ userName: payload.userName })
            )
          }
        }
      } else {
        yield put(createAction('updateState')({ loginError: true }))
      }
      yield put(createAction('updateState')({ fetching: false }))
    },

    *queryLoginUserInfo({ payload }, { call, put }) {
      const loginUserResult = yield call(queryLoginUserInfo, payload)
      if (loginUserResult) {
        Storage.set('userInfo', loginUserResult)
        yield put(createAction('updateState')({ userInfo: loginUserResult }))
      }
    },

    *logout(action, { call, put }) {
      yield call(Storage.set, 'login', false)
      yield put(createAction('updateState')({ login: false }))
      yield put(NavigationActions.navigate({ routeName: 'Login' }))
    },
  },
  subscriptions: {
    setup({ dispatch }) {
      dispatch({ type: 'loadStorage' })
    },
  },
}

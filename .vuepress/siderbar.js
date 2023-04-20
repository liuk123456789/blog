const { createSideBarConfig } = require('./util')
const ES6_PATH = '/blogs/es6'
const VUE3_PATH = '/blogs/vue3'
const DESIGN_MODE_PATH = '/blogs/designMode'
const LEARN_PATH = '/blogs/learn'
const SASS_PATH = '/blogs/sass'
const NGINX_PATH = '/blogs/nginx'
const TS_PATH = '/blogs/ts'
const SOURCE_PATH = '/blogs/source'
const ROLL_UP_PATH = '/blogs/rollup'
const CI_PATH = '/blogs/ci'

module.exports = {
  [ES6_PATH]: [
    createSideBarConfig('ES6', ES6_PATH),
  ],
  [VUE3_PATH]: [
    createSideBarConfig('Vue', VUE3_PATH)
  ],
  [DESIGN_MODE_PATH]: [
    createSideBarConfig('DesignMode', DESIGN_MODE_PATH)
  ],
  [LEARN_PATH]: [
    createSideBarConfig('日常整理', LEARN_PATH)
  ],
  [SASS_PATH]: [
    createSideBarConfig('sass', SASS_PATH)
  ],
  [NGINX_PATH]: [
    createSideBarConfig('nginx', NGINX_PATH)
  ],
  [TS_PATH]: [
    createSideBarConfig('TypeScript', TS_PATH)
  ],
  [SOURCE_PATH]: [
    createSideBarConfig('pinia', SOURCE_PATH + '/pinia'),
    createSideBarConfig('dayjs', SOURCE_PATH + '/dayjs'),
    createSideBarConfig('vitual-scroll', SOURCE_PATH + '/vitual-scroll'),
    createSideBarConfig('vue cli', SOURCE_PATH + '/vue-cli'),
    createSideBarConfig('async validator', SOURCE_PATH + '/async-validator')
  ],
  [ROLL_UP_PATH]: [
    createSideBarConfig('rollup', ROLL_UP_PATH)
  ],
  [CI_PATH]: [
    createSideBarConfig('CI', CI_PATH)
  ]
}
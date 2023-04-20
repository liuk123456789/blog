const sidebar = require('./siderbar.js');

module.exports = {
  "title": "",
  "description": "",
  "dest": "public",
  "base": "/my-blog/",
  "head": [
    [
      "link",
      {
        "rel": "icon",
        "href": "/favicon.ico"
      }
    ],
    [
      "meta",
      {
        "name": "viewport",
        "content": "width=device-width,initial-scale=1,user-scalable=no"
      }
    ]
  ],
  "theme": "reco",
  "themeConfig": {
    "type": 'blog',
    "mode": 'light',
    "subSidebar": 'auto',
    "valineConfig": {
      "appId": 'h6i7vXvVEK37fFFwb1DtMJ6W-gzGzoHsz',
      "appKey": 'cYI3hypnGAI00CPuzhNfeY8Q',
      "showComment": false
    },
    "nav": [
      {
        "text": "主页",
        "link": "/",
        "icon": "reco-home"
      },
      {
        "text": "时间线",
        "link": "/timeline/",
        "icon": "reco-date"
      },
      // {
      //   "text": "Docs",
      //   "icon": "reco-message",
      //   "items": [
      //     {
      //       "text": "vuepress-reco",
      //       "link": "/docs/theme-reco/"
      //     }
      //   ]
      // },
      {
        "text": "相关链接",
        "icon": "reco-message",
        "items": [
          {
            "text": "Github",
            "link": "https://github.com/liuk123456789/blog",
            "icon" "reco-github"
          }
        ]
      }
    ],
    sidebar,
    "blogConfig": {
      "category": {
        "location": 2,
        "text": "目录索引"
      },
      "tag": {
        "location": 3,
        "text": "标签索引"
      }
    },
    "friendLink": [
      {
        "title": "vuepress-theme-reco",
        "desc": "A simple and beautiful vuepress Blog & Doc theme.",
        "avatar": "https://vuepress-theme-reco.recoluan.com/icon_vuepress_reco.png",
        "link": "https://vuepress-theme-reco.recoluan.com"
      }
    ],
    "logo": "/logo.png",
    "search": true,
    "searchMaxSuggestions": 10,
    "lastUpdated": "更新时间",
    "author": "科纳",
    "authorAvatar": "/avatar.jpg",
    "record": "记录所见所得",
    "startYear": "2018"
  },
  "markdown": {
    "lineNumbers": true
  }
}
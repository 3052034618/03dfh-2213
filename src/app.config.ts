export default defineAppConfig({
  pages: [
    'pages/waybills/index',
    'pages/progress/index',
    'pages/receipt/index',
    'pages/detail/index',
    'pages/scan/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E88E5',
    navigationBarTitleText: '冷链通',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F9FF'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E88E5',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/waybills/index',
        text: '我的运单'
      },
      {
        pagePath: 'pages/progress/index',
        text: '路线进度'
      },
      {
        pagePath: 'pages/receipt/index',
        text: '收货验温'
      }
    ]
  }
})

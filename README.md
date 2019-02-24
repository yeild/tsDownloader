# tsDownloader

目前很多视频网站都使用.ts播放视频，该程序可根据m3u8链接批量下载视频并合并为一个文件，同时支持解密AES128加密过的视频。

![](https://img2018.cnblogs.com/blog/1150501/201902/1150501-20190222173212528-1807938093.png)

## 用法

1. 下载并解压[tsDownloader](https://pan.baidu.com/s/1xbB5RpSl0aRhU7emM6T20A)

2. 打开tsDownloader.exe, 填入m3u8链接然后点击下载按钮。


### 如何获得m3u8链接?
在视频页面按F12打开调试模式，选择network, 找到带'm3u8'的请求, 复制requestURL后就可以下载了.
![](https://img2018.cnblogs.com/blog/1150501/201902/1150501-20190222172849760-1901944285.png)

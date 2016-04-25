from scrapy.spiders import BaseSpider
from scrapy.selector import Selector
from lyricwikia.items import LyricwikiaItem
from scrapy.http import Request
import re


class SongIdxSpider(BaseSpider):
    name = 'listlyrics'
    allowed_domains = ["lyrics.wikia.com"]
    start_urls = ["http://lyrics.wikia.com/wiki/Category:Language/Spanish"]

    def parse(self, response):
        hxs = Selector(response)
        link = hxs.xpath('//div[3]/div[2]/a[2]/@href').extract()[0]
        link = "http://lyrics.wikia.com/" + link
        # self.logger.info('link %s', link)
        # store crawled links
        crawledLinks = []

        # pattern to check for proper link
        linkPattern = re.compile(
            "^(?:ftp|http|https):\/\/(?:[\w\.\-\+]+:{0,1}[\w\.\-\+]*@)?" +
            "(?:[a-z0-9\-\.]+)(?::[0-9]+)?(?:\/|\/(?:[\w#!:\.\?\+=&amp;%@!\-\/\(\)]+)|\?" +
            "(?:[\w#!:\.\?\+=&amp;%@!\-\/\(\)]+))?$")

        if linkPattern.match(link) is not None and link not in crawledLinks:
            crawledLinks.append(link)
            yield Request(link, self.parse)

        songslist = hxs.xpath('//tr[1]/td[*]/ul[*]/li/a/@href').extract()
        songsname = hxs.xpath('//tr[1]/td[*]/ul[*]/li/a/text()').extract()
        for idx in xrange(1, len(songslist)):
            item = LyricwikiaItem()
            item['url'] = songslist[idx]
            item['name'] = songsname[idx]
            yield item

from scrapy.spiders import BaseSpider
from scrapy.selector import Selector
from scrapy.exceptions import CloseSpider
from lyricwikia.items import LyricwikiaItem
from scrapy.http import Request
import re
import pandas as pd
import os
import hashlib


class SongItemSpider(BaseSpider):
    name = 'songlyrics'
    allowed_domains = ["lyrics.wikia.com"]

    # check if data dir exists
    files = {}
    if not os.path.exists('data'):
        os.makedirs('data')
    else:
        # create list of files already crawled
        filelist = os.listdir('data')
        for file in filelist:
            #unicode vs. osx filename not the same byte code
            file = file.replace('.html','')
            files[file] = True

    # get data
    data = pd.read_csv('./songsu.csv')
    urls = []
    count = 0
    for entry in data['url']:
        fileexist = files.get(hashlib.sha224(entry).hexdigest())
        if not fileexist or fileexist == None:
            urls.append("http://lyrics.wikia.com" + entry)
        count += 1
    if len(urls) > 0:
        start_urls = urls
    else:
        raise CloseSpider('not_urls')

    def parse(self, response):
        filename = hashlib.sha224(response.url.replace('http://lyrics.wikia.com','')).hexdigest()+'.html';
        hxs = Selector(response)
        if not hxs.xpath('//article/div/div[1]/div[2]/div'):
            raise CloseSpider('missing_content for ' + filename)

        # save file
        with open('./data/' + filename, 'w') as f:
            f.write(response.body)

        # self.logger.info('c: %s', filename)

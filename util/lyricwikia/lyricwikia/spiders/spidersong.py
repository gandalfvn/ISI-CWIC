from scrapy.spiders import BaseSpider
from scrapy.selector import Selector
from scrapy.exceptions import CloseSpider
from scrapy.http import Request
from lyricwikia.items import LyricwikiaItem
import re
import pandas as pd
import os
import hashlib

class SongItemSpider(BaseSpider):
    name = 'songlyrics'
    allowed_domains = ["lyrics.wikia.com"]

    # check if data dir exists
    files = {}
    if not os.path.exists('../../data'):
        os.makedirs('../../data')
    else:
        # create list of files already crawled
        filelist = os.listdir('../../data')
        for file in filelist:
            # unicode vs. osx filename not the same byte code
            file = file.replace('.html','')
            files[file] = True

    # get data
    data = pd.read_csv('./songsu.csv')
    urls = []
    count = 0
    for entry in data['url']:
        fileexist = files.get(hashlib.sha224(data['name'][count]).hexdigest())
        if not fileexist or fileexist == None:
            urls.append("http://lyrics.wikia.com" + entry)
        count += 1
    if len(urls) > 0:
        start_urls = urls
    else:
        raise CloseSpider('not_urls')

    # this requires splash and scrapyjs -
    # http://stackoverflow.com/questions/30345623/scraping-dynamic-content-using-python-scrapy
    # comment this out if you don't want to use splash
    def start_requests(self):
        for url in self.start_urls:
            yield Request(url, self.parse, meta={
                'splash': {
                    'endpoint': 'render.html',
                    'args': {'wait': 0.5}
                }
            })

    def parse(self, response):
        hxs = Selector(response)
        s = hxs.xpath("//*[contains(@class, 'header-title')]/h1/text()").extract()[0].encode('utf-8');
        title = re.sub(r" Lyrics$", '', s)
        filename = hashlib.sha224(title).hexdigest()+'.html'
        if not hxs.xpath('//*[contains(@class, "lyricbox")]'): # //article/div/div[1]/div[2]/div
            raise CloseSpider('missing_content for ' + filename)

        # save file
        with open('../../data/' + filename, 'w') as f:
            f.write(response.body)

        # self.logger.info('c: %s', filename)

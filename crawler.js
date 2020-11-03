const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * 获取summary， contents，
 */
const mirror = {
    wikipedia(query) {
        return `https://en.wikipedia.org/wiki/${query.replace(/\s/g, '_')}`
    },
    wanweibaike(query) {
        return `https://en.wanweibaike.com/wiki-${query.replace(/\s|_/g, '%20')}`
    },
    enwiki3(query) {
        return `https://en.jinzhao.wiki/wiki/${query.replace(/\s/g, '_')}`
    }

}

// 直接获取整个网页 
const crawlPage = (topicName, topicDir) => {
    return new Promise((resolve, reject) => {
        axios.get(encodeURI(mirror.enwiki3(topicName)), {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36",
            },
        }).then(result => {
            fs.writeFile(path.join(topicDir, '/page.html'), result.data, {
                flag: 'w+',
                encoding: 'utf-8'
            }, err => {
                if (err) {
                    reject(err);
                }
                resolve(result.data);
            })

        }).catch((err) => {
            reject(err);
        })
    });

}

// 提取主题描述
const extractSummary = ($) => {
    let select = $('div#mw-content-text').find('div.mw-parser-output').children().first();
    let summary = '';
    
    while (select) {
        const tg = select.get(0) && select.get(0).tagName;
        if(!tg){
            break;
        }
        
        if (tg === 'p' || tg === 'ul') {
            summary += select.text();
        }
        else if (tg === 'div' && select.hasClass('toc')) {
            break;
        } else if (tg === 'h2') {
            break;
        } 
        select = select.next();
    }
    return summary;
}

// 提取分面信息
const extractFacet = ($) => {
    return $('div#toc').find('span.toctext').toArray().map(facet => $(facet).text());
}

// 提取主题上下位信息
const extractHierarchy = ($) => {
    return $('div#mw-normal-catlinks').find('li').toArray().map(li => $(li).text());
}

/**
 * 
 * @param {*} topicName 
 * @param {*} topicDir 
 */

const crawl = async (topicName, topicDir) => {
    let html;
    const topicHtmlPath = path.join(topicDir, '/page.html');
    if (fs.existsSync(topicHtmlPath)) {
        html = fs.readFileSync(topicHtmlPath, {
            encoding: 'utf-8'
        })
    } else {
        html = await crawlPage(topicName, topicDir);
    }
    const $ = cheerio.load(html);

    const summary = extractSummary($);
    const facets = extractFacet($).join('\n');
    const hierarchies = extractHierarchy($).join('\n');

    return Promise.all([
        new Promise((resolve, reject) => {
            fs.writeFile(path.join(topicDir, '/summary.txt'), summary, {
                flag: 'w+',
                encoding: 'utf-8'
            }, err => {
                if (err) {
                    reject(err);
                }
                resolve(summary);
            }),
            new Promise((resolve, reject) => {
                fs.writeFile(path.join(topicDir, '/facets.txt'), facets, {
                    flag: 'w+',
                    encoding: 'utf-8'
                }, err => {
                    if (err) {
                        reject(err);
                    }
                    resolve(facets);
                })
            }),
            new Promise((resolve, reject) => {
                fs.writeFile(path.join(topicDir, '/hierarchies.txt'), hierarchies, {
                    flag: 'w+',
                    encoding: 'utf-8'
                }, err => {
                    if (err) {
                        reject(err);
                    }
                    resolve(hierarchies);
                })
            })
        })
    ])
    




}

module.exports = {
    crawl
}
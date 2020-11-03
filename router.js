const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const crawler = require('./crawler');

/**
 * crawlingStatus: {
 *     'data structure': {
 *          constructedQueue: [],
 *          constucting: string,
 *          waitingForConstruct: [], 
 *      }
 * }
 */

let crawlingStatus = {};
const dataPath = './data/';

const getStatus = (className, topicNames) => {
    if (className in crawlingStatus) {
        return {
            status: 'CONSTRUCTING',
            constructedQueue: crawlingStatus[className].constructedQueue,
            waitingForConstruct: crawlingStatus[className].waitingForConstruct
        };
    };
    if (!fs.existsSync(path.join(dataPath, `/${className}/`))) {
        return {
            status: 'NOT_EXIST'
        };
    };
    const topicPaths = fs.readdirSync(path.join(dataPath, `/${className}/`));
    const notExistTopics = topicNames.filter(t => topicPaths.indexOf(t) === -1);
    if (notExistTopics.length === 0) {
        return {
            status: 'EXIST'
        };
    } else {
        return {
            status: 'NOT_COMPLETE',
            notExistTopics
        };
    }

}

// 输入： 课程，主题列表 => 状态
router.post('/crawl-status', (req, res) => {
    const { body } = req;
    const { className, topicNames } = body;

    res.status(200).json(getStatus(className, topicNames)).end();
})

router.post('/crawl', async (req, res) => {
    const { body } = req;
    const { className, topicNames } = body;

    const status = getStatus(className, topicNames);
    if (status.status === 'CONSTRUCTING') {
        res.status(200).end();
    } else if (status.status === 'EXIST') {
        res.status(200).end();
    } else if (status.status === 'NOT_COMPLETE') {
        res.status(200).end();
        const { notExistTopics } = status;
        crawlingStatus[className] = {
            constructedQueue: [],
            waitingForConstruct: [...notExistTopics]
        }
        try{
            for (let i = 0; i < notExistTopics.length; ++i) {
                fs.mkdirSync(path.join(dataPath, `/${className}/${notExistTopics[i]}`));
                await crawler.crawl(notExistTopics[i], path.join(dataPath, `/${className}/${notExistTopics[i]}`));
                crawlingStatus[className].constructedQueue.push(crawlingStatus[className].waitingForConstruct.shift());
            }
        }
        catch(e){
            console.log('error:', e)
        }
        
        delete crawlingStatus[className];
        
    } else if (status.status === 'NOT_EXIST'){
        res.status(200).end();
        fs.mkdirSync(path.join(dataPath, `/${className}/`));
        crawlingStatus[className] = {
            constructedQueue: [],
            waitingForConstruct: [...topicNames]
        }
        try{
            for (let i = 0; i < topicNames.length; ++i) {
                fs.mkdirSync(path.join(dataPath, `/${className}/${topicNames[i]}`));
                await crawler.crawl(topicNames[i], path.join(dataPath, `/${className}/${topicNames[i]}`));
                crawlingStatus[className].constructedQueue.push(crawlingStatus[className].waitingForConstruct.shift());
    
            }
        }
        catch(e){
            console.log('error: ', e)
        }

        delete crawlingStatus[className];

    }



})

module.exports = router;
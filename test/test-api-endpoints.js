
'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');



const { BlogPost } = require('../models');
const { closeServer, runServer, app } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);



function tearDownDb() {
    return new Promise((resolve, reject) => {
        console.warn('Deleting Database');
        mongoose.connection.dropDatabase()
        .then(result => resolve(result))
        .catch(err => reject(err));
    }); 
};


function seedBlogPostData() {
    console.info('seeding blog post data');
    const seedData = [];
    for (let i = 1; i <= 10; i++) {
        seedData.push({
            author: {
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName()
            },
            title: faker.lorem.sentence(),
            content: faker.lorem.text()
        });
    }
    
    return BlogPost.insertMany(seedData);
}


describe('blog posts API resource', function() {
    
    before(function() {
        return runServer(TEST_DATABASE_URL);    
    });
    
    beforeEach(function(){
        return seedBlogPostData();
    });
    
    afterEach(function(){
        return tearDownDb();
    });
    
    after(function() {
        return closeServer();
    });
    
    
    describe('GET endpoint', function() {
        
        
        it('should return all existing posts', function()   {
            let res;
            return chai.request(app)
                .get('/posts')
                .then(response => {
                res = response;
                res.should.have.status(200);
                res.body.should.have.lengthOf.at.least(1);
                
                return BlogPost.count();
            })
            .then(count => {
                res.body.should.have.lengthOf(count);
            });
        });
    })
})
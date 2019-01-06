
'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');



const { BlogPost } = require('../models');
const { closeServer, runServer, app } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

const should = chai.should();

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
        
        
        it('should return all existing posts', function() {
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
        
        it('should return posts with right fields', function() {
            let resPost;
            return chai.request(app)
            .get('/posts')
            .then(function (res) {
                res.should.have.status(200);
                res.should.be.json;
                res.should.be.a('object');
                res.body.should.have.a.lengthOf.at.least(1);
                
                res.body.forEach(function (post) {
                    post.should.be.a('object');   post.should.include.keys('id','title','content','author','created');
                });
                resPost = res.body[0];
                return BlogPost.findById(resPost.id);
            })
            .then(post => {
                resPost.title.should.equal(post.title);
                resPost.content.should.equal(post.content);
                resPost.author.should.equal(post.authorName);
            });
        });
    });
    
    describe('POST endpoint', function() {
        
        
        it('should add new blog post', function() {
            const newPost = {
                title: faker.lorem.sentence(),
                author: {
                    firstName: faker.name.firstName(),
                    lastName: faker.name.lastName()
                },
                content: faker.lorem.text()
            }
            return chai.request(app)
            .post('/posts')
            .send(newPost)
            .then(function (res) {
                res.should.have.status(201);
                res.should.be.json; res.should.be.a('object');         res.body.should.include.keys('id','title','content','author', 'created');
                res.body.title.should.equal(newPost.title);
                res.body.content.should.equal(newPost.content);
                res.body.author.should.equal(`${newPost.author.firstName} ${newPost.author.lastName}`);
                res.body.id.should.not.be.null;
                res.body.created.should.not.be.null;
                return BlogPost.findById(res.body.id);
                })
            .then(function (post) {
                post.title.should.equal(newPost.title);
                post.content.should.equal(newPost.content);
                post.author.firstName.should.equal(newPost.author.firstName);
                post.author.lastName.should.equal(newPost.author.lastName);
            });
        });
    });
    
    describe('PUT endpoints', function() {
        
        
        it('should update a blog post', function() {
            const updatePost = {
                title: faker.lorem.sentence(),
                author: {
                    firstName: faker.name.firstName(),
                    lastName: faker.name.lastName()
                },
                content: faker.lorem.text()
            };
        
            return BlogPost
                .findOne()
                .then(post => {
                    updatePost.id = post.id;
            
                return chai.request(app)
                    .put(`/posts/${updatePost.id}`)
                    .send(updatePost);
            })
            
            .then(res => {
            res.should.have.status(204);
            return BlogPost.findById(updatePost.id);
            })
            
            .then(post => {
                post.title.should.equal(updatePost.title);
                post.content.should.equal(updatePost.content);
                post.author.firstName.should.equal(updatePost.author.firstName);
                post.author.lastName.should.equal(updatePost.author.lastName);
            });
        });
    });
    
    
    describe('DELETE endpoint', function () {
    
            
        it('should delete a post by id', function () {

            let post;

            return BlogPost
                .findOne()
                .then(response => {
                    post = response;
                    return chai.request(app)
                        .delete(`/posts/${post.id}`);
                })
                .then(res => {
                    res.should.have.status(204);
                    return BlogPost.findById(post.id);
                })
                .then(response => {
                    should.not.exist(response);
                });
        });
    });
});
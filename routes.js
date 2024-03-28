const app = require('./index')
const db = require('./connection')
const mailer = require('./SendMails')

const bcrypt = require("bcryptjs")
const io = require('socket.io')(3000,{
	cors : {
		origin : "*",
		methods: ["GET", "POST"]
	}
})



app.get('/',(req,res)=>{
	res.send('Welcome')
})


//login function  
app.post('/login',(req,res)=>{
	let email = req.body.email
	let password = req.body.password


	db.query('select * from Users where email=?',[email],(err,result,fields)=>{
		if (err) throw err
			if(result.length>0){
				result.forEach((data)=>{

	bcrypt.compare(password, data.password, (err, is_match) => {  
        // If password matches then display true 
        if(is_match){

        	//check if email is verified
        	if(data.emailVerified==0){
        		res.json('email not verified')
        	}else{
        		res.json(result)
        	}

        	
        }else{
        	res.json('login fail')
        }
    })

				})

			}else{
			res.json('login fail')	
			}
	})

})




//get trending topics
app.get('/trending-topics',(req,res)=>{
	db.query('select * from stockTopics',(err,result,fields)=>{
		res.json(result)
	})
})

//get posts
app.get('/get-posts/:user_id',(req,res)=>{
	let user_id = req.params.user_id

	let today = new Date()
	let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()
	let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	let now = date+' '+time;

	db.query('select posts.postTitle as post_title, posts.postHash as post_hash, posts.postId as post_id from posts inner join friendships on posts.userId=friendships.friend where friendships.userId=? and posts.expiresOn>=? limit 5 ',
[user_id,now],(err,result,fields)=>{
	res.json(result)
}
		)
})


//get post details
app.get('/post-details/:post_id',(req,res)=>{
	let post_id = req.params.post_id
	db.query('select * from posts where postId=? ',[post_id],(err,result,fields)=>{
		res.json(result)
	})
})

//get post comments
app.get('/post-comments/:post_id',(req,res)=>{
	let post_id = req.params.post_id
	db.query('select * from comments where post_id=?  order by created asc ',
		[post_id],(err,result,fields)=>{
			res.json(result)
		}
		)
})


//get comment replies
app.get('/comment-replies/:comment_id',(req,res)=>{
	let comment_id = req.params.comment_id
	db.query('select * from comment_replies where comment_id=? order by created desc ',[comment_id],(err,result,fields)=>{
		if(err) throw err
			res.json(result)
	})
})


//fetch my posts
app.get('/my-posts/:user_id',(req,res)=>{
	let user_id = req.params.user_id

let today = new Date()
let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()
let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
let now = date+' '+time;

	db.query('select posts.postTitle as post_title, posts.postHash as post_hash, post_likes.user_id as user_id, count(post_likes.user_id) as total_likes,posts.postId as post_id from posts left join post_likes on posts.postId=post_likes.post_id where posts.userId=? and posts.expiresOn>=? group by posts.postHash,posts.postTitle,post_likes.user_id,posts.created,posts.postId order by posts.created desc',
		[user_id,now],(err,result,fields)=>{
		if(err) throw err
			res.json(result)
	})
})

//delete posts
app.post('/delete-post',(req,res)=>{
	let post_id = req.body.post_id
	db.query('delete from posts where postId=?',[post_id],(err,result)=>{
		if(err) throw err
			res.json('success')
	})
})


//new post
app.post('/new-post',(req,res)=>{
	let post_title = req.body.post_title
	let user_id = req.body.user_id
	let post_hash = ''

	const date = new Date()
	let time = date.getTime()
	let random_number = Math.floor(Math.random()*10000)
	post_hash = random_number+time
	let r = Math.floor(Math.random()*250)
	let g = Math.floor(Math.random()*100)
	let b = Math.floor(Math.random()*150)
	


	//get todays date
	let today = new Date()
	let now_date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()
	let now_time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	let now = now_date+' '+now_time;

	//get expires on 
	let date2 = new Date(now).getTime() + (1000*3600*24)
	date2 = new Date(date2)
	let date3 = date2.getFullYear()+'-'+(date2.getMonth()+1)+'-'+date2.getDate()
	let time2 = date2.getHours() + ":" + date2.getMinutes() + ":" + date2.getSeconds();
	let expires_on = date3+' '+time2

	db.query('insert into posts(postHash,postTitle,r,g,b,userId,expiresOn,created) values(?,?,?,?,?,?,?,?)',
		[post_hash,post_title,r,g,b,user_id,expires_on,now],(err,result)=>{
			if(err) throw err
			res.json('success')
		})
})


//post details 
app.get('/post-details/:post_id',(req,res)=>{
	let post_id = req.params.post_id
	db.query('select * posts where postId=? ',[post_id],(err,result,fields)=>{
		if(err) throw err
			res.json(result)
	})
})


app.post('/edit-post',(req,res)=>{
	let post_id = req.body.post_id
	let post_title = req.body.post_title
	db.query('update posts set postTitle=? where postId=? ',
		[post_title,post_id],(err,result)=>{
			if(err) throw err
				res.json('success')
		})
})







//get comment likes
app.get('/my-comment-likes/:post_id/:user_id',(req,res)=>{
	let post_id = req.params.post_id
	let user_id = req.params.user_id
	db.query('select * from comment_likes where post_id=? and user_id=? ',
		[post_id,user_id],(err,result,fields)=>{
		res.json(result)
		})
})

//comment likes
app.get('/comment-likes/:post_id/:comment_id',(req,res)=>{
	let post_id = req.params.post_id
	let user_id = req.params.user_id
	let comment_id = req.params.comment_id
	db.query('select * from comment_likes where post_id=? and comment_id=? ',
		[post_id,comment_id],(err,result,fields)=>{
		res.json(result)
		})
})

//create topic for a chat
app.post('/create-topic',(req,res)=>{
	let topic_name = req.body.topic_name
	let topic_hash = req.body.topic_hash
	let user_id = req.body.user_id
	let klub = req.body.klub
	let sql = 'insert into topics(userId,topicName,topicHash,forKlub) values(?,?,?,?)'
	db.query('insert into topicHistory(userId,topicName,topicHash) values(?,?,?) ',[user_id,topic_name,topic_hash],(err,result)=>{
		if(err) throw err
	})

	db.query(sql,[user_id,topic_name,topic_hash,klub],(err,result)=>{
		if(err) throw err
		res.json('success')
	})

})


//add friend to klub
app.post('/add-friend',(req,res)=>{
	let user_id = req.body.user_id
	let friend = req.body.friend
	let current_topic_hash = req.body.current_topic_hash

	io.on('connect',(socket)=>{
		socket.join(user_id)
		socket.join(friend)
	})


	//check  if request already exists
	db.query('select * from friendships where userId=? and friend=?',[user_id,friend],(err,result)=>{
		if(err) throw err
		if(result.length>0){
			//means request was already sent,do not send again
			//pass
			//res.json('request already sent')
		}else{
			//no request was sent, send a new one 
			db.query('insert into friendships(userId,friend) values(?,?)',[user_id,friend],(err,result)=>{
				if(err) throw err
				//res.json('success')
			})

		}
	})

	//check if friend had sent you a request already
	db.query('select * from friendships where userId=? and friend=? ',[friend,user_id],(err,result)=>{
		if(err) throw err
			if(result.length>0){
				//friend already sent request,update friendships by 1

				//mark topic frienship as 1
				db.query('update topics set friendship=? where topicHash=? ',[1,current_topic_hash],(err,result)=>{
					if(err) throw err
				})

				//get total friends for user
				db.query('select * from Users where userId=? ',[user_id],(err,result)=>{
					if(err) throw err
					result.forEach((data)=>{
						let total_friends = data.total_friends
						total_friends++
						db.query('update Users set total_friends=? where userId=? ',[total_friends,user_id],(err,result)=>{
							//pass
						})
						
					})

				})

				//get total friends for friend
				db.query('select * from Users where userId=? ',[friend],(err,result)=>{
					if(err) throw err
					result.forEach((data)=>{
						let total_friends = data.total_friends
						total_friends++
						db.query('update Users set total_friends=? where userId=? ',[total_friends,friend],(err,result)=>{
							//pass
						})
						
					})

				})

				//insert into my_friends table
				db.query('insert into my_friends(user_id,friend) values(?,?) ',[user_id,friend],(err)=>{
					if(err) throw err
				})

				db.query('insert into my_friends(user_id,friend) values(?,?) ',[friend,user_id],(err)=>{
					if(err) throw err
				})

				//send notification to user via socketio
				feedback = { 'user_id' : user_id, 'friend' : friend }
				io.to(user_id).emit("new notification",feedback);
				io.to(friend).emit("new notification",feedback);

				res.json('friend added')
			}else{
				res.json('waiting for friend to send request')
			}
	})

})

//get topic hsitory
app.get('/topic-history/:user_id',(req,res)=>{
	let user_id = req.params.user_id
	db.query('select * from topicHistory where userId=? order by id desc limit 5 ',[user_id],(err,result)=>{
		res.json(result)
	})
})

//save topic for later
app.post('/save-for-later',(req,res)=>{
	let topic_hash = req.body.topic_hash
	let user_id = req.body.user_id
	db.query('insert into saveForLater(user_id,topic_hash) values(?,?)',[user_id,topic_hash],(err,result)=>{
		if(err) throw err
			res.json('Topic saved to your library')
	})
})

//get saved topics 
app.get('/saved-topics/:user_id',(req,res)=>{
	let user_id = req.params.user_id
	db.query('select stockTopics.topicName as topic_name, saveForLater.topic_hash as topic_hash, saveForLater.id as id from saveForLater inner join stockTopics on saveForLater.topic_hash=stockTopics.topicHash where saveForLater.user_id=?',[user_id],(err,result)=>{
		res.json(result)
	})
})


//delete a saved topic
app.post('/delete-saved-topic',(req,res)=>{
	let id = req.body.id
	db.query('delete from  saveForLater where id=? ',[id],(err,result)=>{
		res.json('Topic removed from library')
	})
})

//edit account
app.post('/edit-account',(req,res)=>{
	let id = req.body.user_id
	let email = req.body.email
	let phone = req.body.phone
	let password = req.body.password

	//change password 
	if(password){
		bcrypt.hash(password,10, function(err, hash) {
    	db.query('update Users set password=? where userId=?',[hash,id],(err,result)=>{
    		if(err) throw err
    	})
})
	}

	//change the rest
	db.query('update Users set email=?, phone=? where userId=? ',[email,phone,id],(err,result)=>{
		if(err) throw err
			res.json('success')
	})


})


//delete friend 
app.post('/delete-friend',(req,res)=>{
	let user_id = req.body.user_id
	let friend = req.body.friend


	//first check if they are friends 
	db.query('select * from my_friends where user_id=? and friend=? ',[user_id,friend],(err,result)=>{

		if(result.length>0){
			//friendship exists delete
		db.query('delete from  friendships where userId=? and friend=? ', [user_id,friend],(err,result)=>{
		if(err) throw err
	})

	db.query('delete from  friendships where userId=? and friend=? ', [friend,user_id],(err,result)=>{
		if(err) throw err
	})


	//get total friends for user
				db.query('select * from Users where userId=? ',[user_id],(err,result)=>{
					if(err) throw err
					result.forEach((data)=>{
						let total_friends = data.total_friends
						total_friends--
						db.query('update Users set total_friends=? where userId=? ',[total_friends,user_id],(err,result)=>{
							//pass
						})
						//send notification to user via socketio
						
					})

				})

				//get total friends for friend
				db.query('select * from Users where userId=? ',[friend],(err,result)=>{
					if(err) throw err
					result.forEach((data)=>{
						let total_friends = data.total_friends
						total_friends--
						db.query('update Users set total_friends=? where userId=? ',[total_friends,friend],(err,result)=>{
							//pass
						})
						//send notification to user via socketio
						
					})

				})
db.query('delete from  my_friends where user_id=? and friend=? ', [friend,user_id],(err,result)=>{
		if(err) throw err
	})

db.query('delete from  my_friends where user_id=? and friend=? ', [user_id,friend],(err,result)=>{
		if(err) throw err

	})
//delete friend to friend comments
db.query('delete from  comments where user_id=? and post_owner=? ', [user_id,friend],(err,result)=>{
		if(err) throw err

	})
db.query('delete from  comments where user_id=? and post_owner=? ', [friend,user_id],(err,result)=>{
		if(err) throw err

	})
//delete comment replies
db.query('delete from  comment_replies where user_id=? and comment_owner=? ', [user_id,friend],(err,result)=>{
		if(err) throw err

	})
db.query('delete from  comment_replies where user_id=? and comment_owner=? ', [friend,user_id],(err,result)=>{
		if(err) throw err

	})

//delete post likes
db.query('delete from  post_likes where user_id=? and post_owner=? ', [user_id,friend],(err,result)=>{
		if(err) throw err

	})
db.query('delete from  post_likes where user_id=? and post_owner=? ', [friend,user_id],(err,result)=>{
		if(err) throw err

	})



		}

	})


	
	
res.json('success')
})


//get user details
app.get('/user-details/:user_id',(req,res)=>{
	let user_id = req.params.user_id
	db.query('select * from Users where userId=?',[user_id],(err,result)=>{
		if(err) throw err
			res.json(result)
	})	
})


//get my friends
app.get('/get-my-friends/:user_id',(req,res)=>{
	let user_id = req.params.user_id
	db.query('select * from my_friends where user_id=? ',[user_id],(err,result)=>{
		if(err) throw err
			res.json(result)
	})	
})


//get my post likes
app.get('/my-post-likes/:user_id',(req,res)=>{
	let user_id = req.params.user_id
	db.query('select posts.postTitle as post_title, post_likes.post_id as post_id from post_likes inner join posts on posts.postId=post_likes.post_id where post_likes.post_owner=? order by post_likes.id desc ',[user_id],(err,result)=>{
		if(err) throw err
			res.json(result)
	})	
})


//get my post comments
app.get('/my-post-comments/:user_id',(req,res)=>{
	let user_id = req.params.user_id
	db.query('select posts.postId as post_id, posts.postTitle as post_title, comments.message as message, comments.id as id from comments inner join posts on posts.postId=comments.post_id where comments.post_owner=? order by comments.created desc limit 5  ',[user_id],(err,result)=>{
		if(err) throw err
			res.json(result)
	})	
})


//comment details
app.get('/comment-details/:id',(req,res)=>{
	let id = req.params.id
	db.query('select * from comments where id=? ',[id],(err,result)=>{
		if(err) throw err
			res.json(result)
	})	
})

//replies on my comments
app.get('/replies-on-my-comments/:id',(req,res)=>{
	let id = req.params.id
	db.query('select posts.postTitle as post_title, comment_replies.id as id, comment_replies.post_id as post_id, comment_replies.comment_id as comment_id, comment_replies.message as message, comments.message as comment  from comment_replies inner join posts on posts.postId=comment_replies.post_id inner join comments on comments.id=comment_replies.comment_id  where comment_replies.comment_owner=? order by comment_replies.created desc limit 5 ',[id],(err,result)=>{
		if(err) throw err
			res.json(result)
	})	
})


//delete a reply
app.post('/delete-reply',(req,res)=>{
	let id = req.body.id
	db.query('delete from comment_replies where id=? ',[id],(err,result)=>{
		res.json('success')
	})	
})

//check post like 
app.get('/check-post-like/:post_id/:user_id',(req,res)=>{
	let user_id = req.params.user_id
	let post_id = req.params.post_id
	db.query('select * from post_likes where user_id=? and post_id=? ',[user_id,post_id],(err,result)=>{
		res.json(result)
	})	
})


app.post('/send-otp',(req,res)=>{
let email = req.body.email
let otp = Math.floor((Math.random() * 1000) + 9000);
let message = '<p>Hi</p> <p>Here is your otp  : '+otp+'</p>' 

db.query('insert into otp_list(otp,email) values(?,?)',[otp,email],(err)=>{
	if(err) throw err 
})

mailer.send_email(email,'Coil chat  - OTP',message)
res.json(otp)

})

app.post('/confirm-otp',(req,res)=>{
	let email = req.body.email 
	let otp = req.body.otp 
	db.query('select * from  otp_list where email=? and otp=? and used=? ',[email,otp,0],(err,result)=>{
		if(err) throw err
		if(result.length>0){
			//verify email
			db.query('update Users set emailVerified=? where email=? ',[1,email],(err)=>{
				if(err) throw err
			})
			//mark otp used
			//verify email
			db.query('update otp_list set used=? where otp=? ',[1,otp],(err)=>{
				if(err) throw err
			})
			res.json('success')
		}else{
			res.json('fail')
		}
	})
})



app.post('/register',(req,res)=>{
let email = req.body.email
let phone = req.body.phone
let password = req.body.password

//check if account exists
db.query('select * from Users where email=? ',[email],(err,result)=>{

	if(result.length>0){
		//account exists
		res.json('exists')
	}else{

		//hash password
bcrypt.hash(password,10, function(err, hash) {
	let new_password = hash
  db.query('insert into Users(email,phone,password) values(?,?,?) ',[email,phone,new_password],(err)=>{
  	if(err) throw err 
		})
})


		res.json('success')
	}

})

})


//send password reset link
app.post('/send-password-link',(req,res)=>{
	let email = req.body.email

	db.query('select * from Users where email=? ',[email],(err,result)=>{
		if(err) throw err
		if(result.length>0){
			let link = 'http://127.0.0.1:8080/new-password/'+email
			let message = '<p>Hi</p> <p>Here is your password reset link</p> <p>Link : '+
			link + '</p>'

			mailer.send_email(email,'Password reset link',message)
			res.json('success')
		}else{
			res.json('fail')
		}
	})

})


//reset password
app.post('/reset-password',(req,res)=>{
	let email = req.body.email
	let password = req.body.password
	bcrypt.hash(password,10, function(err, hash) {
    	db.query('update Users set password=? where email=?',[hash,email],(err,result)=>{
    		if(err) throw err
    	})
})

res.json('success')

})

app.get('/get-chat-messages/:topic_hash',(req,res)=>{
	let topic_hash = req.params.topic_hash
	db.query('select * from messages where topicHash=? ', [topic_hash], (err,result)=>{
		res.json(result)
	} )

})







//socket io connection 

io.on('connect', (socket) => {
	//join all necessary rooms.Was to do this earlier 
	socket.join('comment reply room')
	socket.join('new friend alert room')


	let post_room = 0;
	//join post room
	socket.on('joinroom',(data)=>{
		//join post room
		let room = data.post_id
		post_room = room
		socket.join(room)
		feedback = 'room: '+room+' joined'
		io.to(room).emit("roomjoined",feedback);
		console.log('room joined='+room)
	})

		//post msg
	socket.on('post msg',(data)=>{
		socket.join('comments alert room')
		if(data.message){

		let room = data.room
		let user_id = data.user_id
		let message = data.message
		let post_owner = data.post_owner
		db.query('insert into comments(post_id,user_id,message,post_owner) values(?,?,?,?)',[room,user_id,message,post_owner],
			(err,result)=>{
				if (err) throw err
					//res.json('success')
			}
			)
		
		feedback = { 'user_id' : user_id, 'post_id' : data.room, 'message' : message, 'post_owner' : post_owner }
		io.to('comments alert room').emit("new post comment",feedback)

		console.log('new post comment')

		}
	})

	//like a post comment 
	socket.on('like comment',(data)=>{
		let user_id = data.user_id
		let post_id = data.post_id
		let comment_id = data.comment_id
		let total_likes = 0 

		//get total likes
		db.query('select * from comments where id=? ',[comment_id],(err,result,fields)=>{
			if(err) throw err
			result.forEach((data)=>{
				total_likes = data.total_likes
			})
		})

		//check if comment was already liked
		db.query('select * from comment_likes where post_id=? and user_id=? and comment_id=?',
			[post_id,user_id,comment_id],(err,result,fields)=>{
				if (err) throw err

					if(result.length>0){
						db.query('delete from comment_likes where post_id=? and user_id=? and comment_id=? ',
							[post_id,user_id,comment_id],(err,result)=>{
								if(err) throw err
							})
						total_likes = total_likes-1

						

		//update total likes 
		db.query('update comments set total_likes=? where id=? ',[total_likes,comment_id],(err,result,fields)=>{
			if(err) throw err
		})
						
					}else{

		db.query('insert into comment_likes(post_id,user_id,comment_id) values(?,?,?) ',
			[post_id,user_id,comment_id],(err,result)=>{
				if (err) throw err
			})
			total_likes = total_likes+1
			

		//update total likes 
		db.query('update comments set total_likes=? where id=? ',[total_likes,comment_id],(err,result,fields)=>{
			if(err) throw err
		})

					}
			})
		

		feedback = comment_id + ' liked'
		io.to(post_id).emit('comment liked',feedback)
	})




	//save comment reply
	socket.on('send reply',(data)=>{
		let user_id = data.user_id
		let post_id = data.post_id
		let comment_id = data.comment_id
		let comment_owner = data.comment_owner
		let message = data.message
		let feedback = { 'user_id' : user_id, 'post_id' : post_id, 'comment_id' : comment_id, 'message' : message, 'comment_owner' : comment_owner }
		db.query('insert into comment_replies(post_id,user_id,comment_id,message,comment_owner) values(?,?,?,?,?)',
			[post_id,user_id,comment_id,message,comment_owner],(err,result)=>{
				if(err) throw err
			})
		
		io.to('comment reply room').emit('reply received',feedback)
	})

	//check if someone joined chat waiting room
		socket.on('joined waiting room',(data)=>{
		let room = data.waiting_room_id
		socket.join(room)
		feedback = 'room: '+room+' joined'
		io.to(room).emit("joined waiting room",feedback);
		console.log('room joined='+room)
	})


	//check if someone joined klub chat waiting room
		socket.on('joined klub waiting room',(data)=>{
		let room = data.waiting_room_id
		socket.join(room)
		feedback = 'room: '+room+' joined'
		io.to(room).emit("joined klub waiting room",feedback);
		console.log('klub room joined='+room)
	})


	//fetch chat topics using socket io
	socket.on('fetch chat topics',(data)=>{
		//call a function to fetch chat topics
		let room = data.room
		let user_id = data.user_id
		socket.join(room)

		db.query('select * from topics where clicked=? and forKlub=? and userId!=?',[0,0,user_id],(err,result,fields)=>{
		if(err) throw err
			io.to(room).emit('topics',result)
	})

	})

		//fetch klub chat topics using socket io
	socket.on('fetch klub chat topics',(data)=>{
		//call a function to fetch chat topics
		let room = data.room
		socket.join(room)

		db.query('select * from topics where clicked=? and forKlub=?',[0,1],(err,result,fields)=>{
		if(err) throw err
			io.to(room).emit('klub topics',result)
	})

	})

	//check if a topic has been clicked
	socket.on('click topic',(data)=>{
		let clicked_topic_hash = data.clicked_topic_hash
		let room = data.room 

		//mark topic clicked
		db.query('update  topics set clicked=? where topicHash=? ',[1,clicked_topic_hash],(err,result)=>{
			if(err) throw err
		})

		//tell the owner that the topic is clicked
		io.to(room).emit('my clicked topic',clicked_topic_hash)

		//return only topics not clicked
		db.query('select * from topics where clicked=?',[0],(err,result,fields)=>{
		if(err) throw err
			io.to(room).emit('topics after clicking',result)
	})

	})



	//check if a klub topic has been clicked
	socket.on('click klub topic',(data)=>{
		let clicked_topic_hash = data.clicked_topic_hash
		let room = data.room 

		//mark topic clicked
		db.query('update  topics set clicked=? where topicHash=? and forKlub=? ',[1,clicked_topic_hash,1],(err,result)=>{
			if(err) throw err
		})

		//tell the owner that the topic is clicked
		io.to(room).emit('my klub clicked topic',clicked_topic_hash)

		//return only topics not clicked
		db.query('select * from topics where clicked=? and forKlub=?',[0,1],(err,result,fields)=>{
		if(err) throw err
			io.to(room).emit('klub topics after clicking',result)
	})

	})



	//check if someone is in the chatroom 
	socket.on('join chat room',(data)=>{
		let user_id = data.user_id
		socket.join(data.room)
		io.to(data.room).emit('member joined',user_id)
	})

	//get friend 
	socket.on('get friend',(data)=>{
		let user_id = data.user_id
		socket.join(data.room)
		io.to(data.room).emit('friend is',user_id)
	})


	



	//check for incoming chat message
	socket.on('chat message',(data)=>{
		let user_id = data.user_id
		let room = data.room
		let message = data.message
		db.query('insert into messages(author,message,topicHash) values(?,?,?)',[user_id,message,room],(err,result)=>{
			if(err) throw err
		});
		io.to(room).emit('new message',{'message' : message,'sender':user_id})
	})

	//check if someone leaves chat room 
	socket.on('leave chat room',(data)=>{
		socket.leave(data.room)
		io.to(data.room).emit('someone left chat room',data.room)
	})


	//leave waiting room 
	socket.on('leave waiting room',(data)=>{
		socket.leave(data.room)
		//the topics will be marked as clicked
		//mark topic clicked
		db.query('update  topics set clicked=? where topicHash=? ',[1,data.room],(err,result)=>{
			if(err) throw err
		})


		//return only topics not clicked
		db.query('select * from topics where clicked=?',[0],(err,result,fields)=>{
		if(err) throw err
			io.to('topics page').emit('topics after clicking',result)
	})
	})


		//leave klub waiting room 
	socket.on('leave klub waiting room',(data)=>{
		socket.leave(data.room)
		//the topics will be marked as clicked
		//mark topic clicked
		db.query('update  topics set clicked=? where topicHash=? and forKlub=? ',[1,data.room,1],(err,result)=>{
			if(err) throw err
		})


		//return only topics not clicked
		db.query('select * from topics where clicked=? and forKlub=?',[0,1],(err,result,fields)=>{
		if(err) throw err
			io.to('klub topics page').emit('klub topics after clicking',result)
	})
	})


	//check if someone disconects
	socket.on('disconnect',()=>{

		feedback = 'someone left'
		io.to(post_room).emit("someone left",feedback);
		console.log(feedback)
	})

	//send friend request
	socket.on('friend request',(data)=>{
		let room = data.room
		let sender_id = data.sender_id
		io.to(room).emit("new friend request",sender_id);
		
	})


	


	//like a post via socket io
	socket.on('like post',(data)=>{
		socket.join('notification room')

		//update likes table
		let user_id = data.user_id
		let post_id = data.post_id
		let post_owner = data.post_owner

		//check if post was already liked
		db.query('select * from post_likes where post_id=? and user_id=?',
			[post_id,user_id],(err,result,fields)=>{
				if (err) throw err

					if(result.length>0){
						db.query('delete from post_likes where post_id=? and user_id=?',
							[post_id,user_id],(err,result)=>{
								if(err) throw err
							})
						
					}else{

			//check if post is not null
			if(post_id){
				db.query('insert into post_likes(post_id,user_id,post_owner) values(?,?,?) ',
			[post_id,user_id,post_owner],(err,result)=>{
				if (err) throw err
			})
			io.to('notification room').emit('post for liked',{ 'user_id' : data.user_id, 'post_id' : data.post_id, 'post_owner' : data.post_owner })
			//res.json('liked')
			}


					}
			})
		//like post 


	})

  console.log('a user connected now')
})





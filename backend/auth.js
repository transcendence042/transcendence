import bcrypt from 'bcrypt';
import { User, Friendship, Match } from './db.js';
import { Op } from 'sequelize';

// Google OAuth2 callback
export async function authGoogleCallback(req, reply) {
    const tokenResponse = await req.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
  const accessToken = tokenResponse.token.access_token;

  // Fetch user profile from Google
  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await response.json();

  // Find or create user in DB
  let user = await User.findOne({ where: { provider: 'google', providerId: profile.sub } });
  if (!user) {
    user = await User.create({
      username: profile.name,
      email: profile.email,
      displayName: profile.name,
      provider: 'google',
      providerId: profile.sub,
      avatarUrl: profile.picture,
      emailVerified: profile.email_verified,
      password: '', // no password for Google accounts
    });
  }

  // Issue your own JWT
  const myJwt = req.server.jwt.sign(
    { id: user.id, username: user.username, displayName: user.displayName },
    { expiresIn: '7d' }
  );

  // Redirect back to frontend with JWT in URL fragment
  // Use frontend URL from environment variable or fallback to localhost
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login.html';
  return reply.redirect(`${frontendUrl}#token=${myJwt}&viaGoogle=true`);
}

export async function register(req, reply) {
  const { username, password, emailOptional, displayNameOptional } = req.body;
  let email;
  let displayName;
  if (username === "" || password === "") return reply.code(400).send({ error: 'Username and password are required' });
  if (emailOptional === "" || displayNameOptional === "") {
	email = null;
	displayName = username;
  }
  else {
	email = emailOptional;
	displayName = displayNameOptional;
  }

  try {
	const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      password: hashed, 
      email, 
      displayName
    });
    reply.send({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.code(400).send({ error: 'Username or display name already exists' });
    } else {
      reply.code(500).send({ error: 'Registration failed', details: error.message });
    }
  }
}

export async function changePassword(req, reply) {
	const {oldPassword, newPassword} = req.body;
  console.log("changing password updating!")

	try {
		const user = await User.findByPk(req.user.id);
		if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
			return reply.code(401).send({ error: 'Invalid Password' });
		}
		const passwordHash = await bcrypt.hash(newPassword, 10);
		await user.update({
			password: passwordHash
		})
    console.log("chPassword has been update!!!!!")
		reply.send({message: 'Password has been change correctly!', id: user.id, username: user.username})
	}
	catch (e) {
		 reply.code(500).send({ error: 'Password update failed' });
	}
}

export async function login(req, reply) {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // Update online status
  await user.update({ isOnline: true, lastSeen: new Date(), sessions: (user.sessions || 0) + 1 });

  const token = req.server.jwt.sign({ 
    id: user.id, 
    username: user.username, 
    displayName: user.displayName 
  });

  const friends = await Friendship.findAll({
    where: {
      [Op.or]: [
        {userId: user.id, status: 'accepted'},
        {friendId: user.id, status: 'accepted'}
      ]
    },
    include: [
      {
        model: User,
        as: 'User',
        attributes: ["id"]
      },
      {
        model: User,
        as: 'Friend',
        attributes: ["id"]
      }
    ]
  })

  if (friends) {
    const friendId = friends.map(friend => friend.userId === user.id ? friend.Friend.id : friend.User.id);
    friendId.forEach(friendId => {
      console.log(`Sending im loggins to friend with the id :${friendId}`);
      const friendSocketId = req.server.onlineUsers.get(friendId);
      if (friendSocketId) {
        req.server.io.to(friendSocketId).emit("friendConnected", {username: user.username, id: user.id});
      }
    });
  }
  else
      console.log(`CURRENTLY NO FRIENDS FOR:${user.username}`)
  reply.send({ token, user: { id: user.id, username: user.username, displayName: user.displayName } });
}

export async function logout(req, reply) {
  console.log(`🚪 Starting logout process for user: ${req.user.username} (ID: ${req.user.id})`);
  
  const user = await User.findByPk(req.user.id);
  if (user) {
    // CAMBIO: Siempre marcar como offline en logout, ignorar sistema de sesiones por ahora
    console.log(`� Forcing user ${user.username} offline`);
    
    await user.update({ 
      isOnline: false,  // FORZAR offline siempre
      lastSeen: new Date() 
    });
    
    // Forzar eliminación de onlineUsers
    const wasInOnlineUsers = req.server.onlineUsers.has(user.id);
    console.log(`� User ${user.username} was in onlineUsers: ${wasInOnlineUsers}`);
    
    if (wasInOnlineUsers) {
      req.server.onlineUsers.delete(user.id);
      console.log(`✅ User ${user.username} forcefully removed from onlineUsers`);
    }
    
    // Obtener amigos y notificarles del logout
    const friends = await Friendship.findAll({
      where: {
        [Op.and]: [
          { status: 'accepted' },
          {
            [Op.or]: [
              { userId: req.user.id },
              { friendId: req.user.id }
            ]
          }
        ]
      },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ["id"]
        },
        {
          model: User,
          as: 'Friend',
          attributes: ["id"]
        }
      ]
    });
    
    if (friends && friends.length > 0) {
      const friendsId = friends.map(friend => (friend.userId === req.user.id ? friend.Friend.id : friend.User.id));
      console.log(`📢 Notifying ${friendsId.length} friends that ${user.username} logged out`);

      friendsId.forEach(friendId => {
        const friendSocketId = req.server.onlineUsers.get(friendId);
        console.log(`📬 Friend ${friendId} socketId: ${friendSocketId}`);
        
        if (friendSocketId) {
          console.log(`✅ HTTP LOGOUT: Emitting friendLogout to socketId: ${friendSocketId} for user: ${user.username}`);
          req.server.io.to(friendSocketId).emit("friendLogout", {username: user.username, id: user.id});
        } else {
          console.log(`❌ Friend ${friendId} is not online, cannot emit event`);
        }
      });
      
      // TAMBIÉN: Emitir evento broadcast para asegurar que llegue
      console.log(`📡 Broadcasting friendLogout for user: ${user.username}`);
      req.server.io.emit("friendLogout", {username: user.username, id: user.id});
    } else {
      console.log(`📭 User ${user.username} has no friends to notify`);
    }
  }
  
  reply.send({ message: 'Logged out successfully' });
}

export async function me(req, reply) {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }
  });
  reply.send({ user });
}

export async function updateProfile(req, reply) {
  const { displayName, email, avatar } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    await user.update({ 
      displayName: displayName || user.displayName,
      email: email || user.email,
      avatar: avatar || user.avatar
    });
    reply.send({ message: 'Profile updated successfully', user: { 
      id: user.id, 
      username: user.username, 
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar
    }});
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      reply.code(400).send({ error: 'Display name already exists' });
    } else {
      reply.code(500).send({ error: 'Profile update failed' });
    }
  }
}

export async function getUserProfile(req, reply) {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) return reply.code(404).send({ error: 'User not found' });
    
    // Get recent matches separately to avoid complex joins
    const recentMatches = await Match.findAll({
      where: {
        [Op.or]: [
          { player1Id: userId },
          { player2Id: userId }
        ]
      },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        { model: User, as: 'Player1', attributes: ['username', 'displayName'] },
        { model: User, as: 'Player2', attributes: ['username', 'displayName'] },
        { model: User, as: 'Winner', attributes: ['username', 'displayName'] }
      ]
    });
    
    reply.send({ user: { ...user.toJSON(), recentMatches } });
  } catch (error) {
    console.error('Get user profile error:', error);
    reply.code(500).send({ error: 'Failed to fetch user profile' });
  }
}

export async function sendFriendRequest(req, reply) {
  const { friendUsername } = req.body;
  console.log(`BACK-END     friend request sent to ${friendUsername}!`)
  try {
    const friend = await User.findOne({ where: { username: friendUsername } });
    if (!friend) return reply.code(404).send({ error: 'User not found' });
    if (friend.id === req.user.id) return reply.code(400).send({ error: 'Cannot add yourself as friend' });

    // Check if friendship already exists
    const existingFriendship = await Friendship.findOne({
      where: {
        [Op.or]: [
          { userId: req.user.id, friendId: friend.id },
          { userId: friend.id, friendId: req.user.id }
        ]
      }
    });

    if (existingFriendship) {
      console.log('Friendship already exists:', existingFriendship);
      return reply.code(400).send({ error: 'Friendship request already exists' });
    }

    await Friendship.create({
      userId: req.user.id,
      friendId: friend.id,
      status: 'pending'
    });
    
    // check if friend is online
    const friendSocketId = req.server.onlineUsers.get(friend.id);
  if (friendSocketId) {
    req.server.io.to(friendSocketId).emit("sendFriendRequest", {
      from: req.user.username,
      to: friend.username
    });
  }
    reply.send({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error("❌ sendFriendRequest error:", error);
    reply.code(500).send({ error: 'Failed to send friend request' });
  }
}

export async function respondToFriendRequest(req, reply) {
  const { requestId, action } = req.body; // action: 'accept' or 'reject'
  try {
    const friendship = await Friendship.findOne({
      where: { id: requestId, friendId: req.user.id, status: 'pending' }
    });

    if (!friendship) return reply.code(404).send({ error: 'Friend request not found' });

    if (action === 'accept') {
      await friendship.update({ status: 'accepted' });
      reply.send({ message: 'Friend request accepted' });

      const me = await User.findByPk(req.user.id, {
        attributes: ['username', 'displayName']
      });
      
      if (me) {
        // Emitir al usuario que envió la solicitud (friendship.userId), no al requestId
        const requesterSocketId = req.server.onlineUsers.get(friendship.userId);
        if (requesterSocketId) {
          req.server.io.to(requesterSocketId).emit("acceptedFriendRequest", {
            friendUsername: me.username, 
            friendDisplayName: me.displayName
          });
        }
      }
    } else {
      await friendship.destroy();
      reply.send({ message: 'Friend request rejected' });
    }
  } catch (error) {
    reply.code(500).send({ error: 'Failed to respond to friend request' });
  }
}

export async function getFriendRequests(req, reply) {
  try {
    const friendRequest = await Friendship.findAll({
      where: {
        [Op.or]: [
          { friendId: req.user.id, status: 'pending' }
        ]
      },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline', 'lastSeen', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    reply.send({friendRequest});
  }
  catch (error) {
    console.error('getFriendRequests error:', error);
    reply.code(500).send({ error: 'Failed to get friend-Requests' });
  }
}

export async function getFriends(req, reply) {
  console.log(`👥 Getting friends for user: ${req.user.username} (ID: ${req.user.id})`);
  try {
    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          { userId: req.user.id, status: 'accepted' },
          { friendId: req.user.id, status: 'accepted' }
        ]
      },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline', 'lastSeen']
        },
        {
          model: User,
          as: 'Friend',
          attributes: ['id', 'username', 'displayName', 'avatar', 'isOnline', 'lastSeen']
        }
      ]
    });

    const friends = friendships.map(friendship => {
      const friend = friendship.userId === req.user.id ? friendship.Friend : friendship.User;
      console.log(`👤 Friend: ${friend.username} (ID: ${friend.id}) - isOnline: ${friend.isOnline}`);
      return {...friend.toJSON(), challenge: friendship.challenge};
    });

    console.log(`📋 Returning ${friends.length} friends for ${req.user.username}`);
    reply.send( {friends} );
  } catch (error) {
    console.error('getFriends error:', error);
    reply.code(500).send({ error: 'Failed to fetch friends' });
  }
}

export async function getMatchHistory(req, reply) {
  try {
    const matches = await Match.findAll({
      where: {
        [Op.or]: [
          { player1Id: req.user.id },
          { player2Id: req.user.id }
        ]
      },
      include: [
        { model: User, as: 'Player1', attributes: ['username', 'displayName'] },
        { model: User, as: 'Player2', attributes: ['username', 'displayName'] },
        { model: User, as: 'Winner', attributes: ['username', 'displayName'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    console.log(`getting matchHistory!!!!matches = ${matches.map(m => `${m.Player1.username} vs ${m.Player2.username}`).join(', ')}`);
    reply.send({ matches });
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch match history' });
  }
}

export async function authenticate(req, reply) {
  try {
    await req.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized' });
  }
}

export async function challenge(req, reply) {
	const { friendUsername } = req.body;

	if (!friendUsername) reply.code(404).send({ error: 'User not found' });

	try {
		const friend = await User.findOne({ where: { username: friendUsername } });
		if (!friend) throw 1;
		const friendshipRow = await Friendship.findOne({
			where: {
				[Op.or]: [
					{ userId: req.user.id, friendId: friend.id },
					{ userId: friend.id, friendId: req.user.id }
				]
			}
		});
		if (!friendshipRow) return reply.code(404).send({ error: 'Friendship not found' });
		await friendshipRow.update({challenge: friend.username});
		reply.send({ message: 'Challenge Friend request sent successfully' });

	}
	catch {
		reply.code(500).send({ error: 'Failed to sent challenge to a friend' });
	}
}

export async function respondChallenge(req, reply) {
	const { friendUsername } = req.body;
	console.log(friendUsername, "88888888888888888888888888888888888888888888888888888")

	try {
		const friend = await User.findOne({where: {username: friendUsername}});
		const me = await User.findByPk(req.user.id)
		if (!me) reply.code(404).send({ error: 'User not found' });
		if (!friend) reply.code(404).send({ error: 'User not found' });
		const friendshipRow = await Friendship.findOne({
			where: {
				[Op.or]: [
					{ userId: req.user.id, friendId: friend.id },
					{ userId: friend.id, friendId: req.user.id }
				]
			}
		});
		if (!friendshipRow) return reply.code(404).send({ error: 'Friendship not found' });
		await friendshipRow.update({challenge: ""});
		const myUsername = me.username;
		console.log(friendUsername, "respondChallenge AFTEER UPDATING!!!1111111111111111111111111111111111111111111111111111111111111")
		reply.send({ ...friend.toJSON(), userId: req.user.id, myUsername});
	}
	catch {
		reply.code(500).send({ error: 'Failed to sent challenge to a friend' });

	}
}


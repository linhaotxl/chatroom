/**
 *  服务端
 */

// 创建服务
const app   = require( 'http' ).createServer( handler );
const fs    = require( 'fs' );
const path  = require( 'path' );
const url   = require( 'url' );

const MIME  = require( './mime' );

// 
const io = require( 'socket.io' )( app );

// 定义端口号
const PORT = 8081;

// 保存所有用户的数组
let users = [];

// 状态
const Status = {
    s101: 's101',   // 登录成功
    e101: 'e101',   // 登录失败，用户名重复
    s102: 's102',   // 退出成功
};

// 监听端口
app.listen( PORT );

// 监听客户端连接
// 回调里的参数 socket 就是本次连接的客户端
io.on( 'connection', socket => {
    // 监听客户端的登录事件
    socket.on( 'login', data => {
        const currentUsername = data.username;
        if ( users.indexOf( currentUsername ) === -1 ) {
            users.push( currentUsername );
            // 触发客户端的 loginSuccess 事件
            socket.emit( 'loginSuccess', Status.s101 );
            // 向当前客户端之外的所有客户端广播
            socket.broadcast.emit( 'addUser', currentUsername );
        } else {
            return socket.emit( 'loginFail', Status.e101 );
        }
    });

    // 监听客户端退出事件
    socket.on( 'logout', data => {
        const index = users.indexOf( data.username );
        if ( users.splice( index, 1 ).length ) {
            // 触发客户端的 logoutSuccess 事件
            socket.emit( 'logoutSuccess', Status.s102 );
            // 向当前客户端之外的所有客户端广播
            socket.broadcast.emit( 'removeUser', data.username );
        }
    });

    // 监听客户端发送消息的事件
    socket.on( 'sendMessage', data => {
        console.log( data )
        socket.emit( 'sendMessageSuccess', data );
        socket.broadcast.emit( 'sendMessageOtherSuccess', data );
    });
});

function handler ( req, res ) {
    if ( req.url === '/favicon.ico' ) {
        return;
    }

    const extension = path.extname( req.url );
    const filename  = path.basename( req.url, extension );

    fetchFileData( url.parse( req.url ).pathname, ( data, path, err ) => {
        const header = {
            'content-type': MIME[ extension ]
        };

        if ( err ) {
            res.writeHead( 500, header );
            res.end( `Error loading ${ path }` );
            return ;
        }

        res.writeHead( 200, header );
        res.end( data );
        return ;
    });
}

/**
 *  读取取文件的数据
 *  @param { String } filename 文件名
 *  @param { String } extension 扩展名
 */
function fetchFileData ( pathname, callback ) {
    
    let filepath = '';
    const indexPattern = /^(\/index.html)/;
    // 除了 index.html 之外，访问其余的文件都要从 static 里查找
    if ( pathname === '/' || indexPattern.test( pathname ) ) {
        filepath = path.join( __dirname, '/index.html' );
    } else {
        filepath = path.join( __dirname, 'static', pathname );
    }
    
    fs.readFile( filepath, ( err, data ) => {
        callback( data, filepath, err );
    });
}
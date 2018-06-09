
(function ( window, $ ) {

    var _username           = '';       // 保存当前客户端的用户名
    var $loginContainer     = null;     
    var $chatroomContainer  = null;
    var $chatroomHeader     = null;
    var $chatroomBack       = null;
    var $chatroomForm       = null;
    var $usernameInput      = null;
    var $loginBtn           = null;
    var $chatLists          = null;
    var $cloneJoin          = null;
    var $cloneExit          = null;
    var $cloneSelfMessage   = null;
    var $cloneOtherMessage  = null;
    var $sendMessageBtn     = null;     // 发送消息的按钮
    var $messageInput       = null;     // 发送消息的输入框
    var socket = io( 'ws://localhost:8081' );
    var _isLogin            = false;    // 是否登录成功
    var Status = {
        s101: 's101',   // 登录成功
        e101: 'e101',   // 登录失败，用户名重复
        s102: 's102',   // 退出成功
    };

    $(function () {
        $loginContainer     = $( '#login' );
        $chatroomContainer  = $( '#chatroom' );
        $chatroomForm       = $( '.chatroom_form' );
        $chatroomHeader     = $( '.chatroom_header' );
        $chatroomBack       = $( '.back_icon' );

        $chatLists          = $( '.chat_lists' );
        $cloneJoin          = $( '.join' );
        $cloneExit          = $( '.exit' );
        $cloneSelfMessage   = $( '.self_message' );
        $cloneOtherMessage  = $( '.other_message' );

        $sendMessageBtn     = $( '#send_message_btn' );
        $messageInput       = $( '#message_input' );

        // 监听返回按钮的事件
        $chatroomBack.on( 'click', handlerBack );

        $usernameInput = $( '#username_input' );
        $usernameInput.on( 'input', handlerUsernameInput );

        $loginBtn = $( '#login_button' );
        $loginBtn.on( 'click', handlerLogin );

        // 监听发送消息的按钮
        $sendMessageBtn.on( 'click', handlerSendMessage );

        // 监听登录成功的事件
        socket.on( 'loginSuccess', handlerLoginSuccess );
        // 监听登录失败的事件
        socket.on( 'loginFail', handlerLoginFail );
        // 监听退出成功的事件
        socket.on( 'logoutSuccess', handlerLogoutSuccess );
        // 监听有新成员加入群聊的事件
        socket.on( 'addUser', handlerAddUser );
        // 监听有成员退出群聊的事件
        socket.on( 'removeUser', handlerRemoveUser );
        // 监听消息发送成功的事件，当前客户端看到
        socket.on( 'sendMessageSuccess', handlerSendMessageSuccess );
        // 监听消息发送成功的事件，其他客户端看到
        socket.on( 'sendMessageOtherSuccess', handlerSendMessageOtherSuccess );
    });

    /**
     *  用户名的输入事件
     */
    function handlerUsernameInput () {
        _username = $( this ).val().trim();
    }

    /**
     *  登录按钮的事件
     */
    function handlerLogin () {
        if ( !_username ) {
            alert( '请输入用户名' );
            return false;
        }
        // 向服务端触发登录事件，服务端要监听 login 事件
        socket.emit( 'login', { username: _username } );

        return false;
    }

    /**
     *  登录成功的事件
     *  @param { String } status 状态
     */
    function handlerLoginSuccess ( status ) {
        if ( status === Status.s101 ) {
            // 登录成功
            _isLogin = true;
            $loginContainer.css( 'left', '-100%' );
            $chatroomContainer.css( 'left', '0' );
            $chatroomForm.css( 'position', 'fixed' );
            $chatroomHeader.css( 'position', 'fixed' );
        }
    }

    /**
     *  退出成功的事件
     *  @param { String } status 状态
     */
    function handlerLogoutSuccess ( status ) {
        if ( status === Status.s102 ) {
            // 退出成功
            _isLogin = false;
            $chatLists.find( 'li:not(.clone_item)' ).remove();
        }
    }

    /**
     *  登录失败的事件
     *  @param { String } status 状态
     */
    function handlerLoginFail ( status ) {
        if ( status === Status.e101 ) {
            alert( '已存在的用户名，请重新输入' );
        }
    }

    /**
     *  新成员加入群聊的事件
     *  @param { String } user 新成员的用户名
     */
    function handlerAddUser ( user ) {
        // 如果当前客户端没有登录，那么就收不到任何消息
        if ( !_isLogin ) {
            return ;
        }
        const $clone = $cloneJoin.clone();
        $clone.removeClass( 'clone_item' );
        $clone.find( '.join_username' ).html( user );
        $chatLists.append( $clone );
        scrollBottom();
    }

    /**
     *  成员退出群聊的事件
     *  @param { String } user 成员的用户名
     */
    function handlerRemoveUser ( user ) {
        const $clone = $cloneExit.clone();
        $clone.removeClass( 'clone_item' );
        $clone.find( '.exit_username' ).html( user );
        $chatLists.append( $clone );
        scrollBottom();
    }

    /**
     *  消息发送成功的事件
     *  @param { String } message 新消息
     */
    function handlerSendMessageSuccess ( data ) {
        const $clone = $cloneSelfMessage.clone();
        $clone.removeClass( 'clone_item' );
        $clone.find( '.self_message_text' ).html( data.message );
        $chatLists.append( $clone );
        scrollBottom();
    }

    /**
     *  消息发送成功的事件，其他客户端看到
     *  @param { String } message 新消息
     */
    function handlerSendMessageOtherSuccess ( data ) {
        const $clone = $cloneOtherMessage.clone();
        $clone.removeClass( 'clone_item' );
        $clone.find( '.other_username' ).html( data.username );
        $clone.find( '.other_message_text' ).html( data.message );
        $chatLists.append( $clone );
        scrollBottom();
    }

    /**
     *  将消息区域滚动到底部的方法
     */
    function scrollBottom () {
        const scrollHeight = $chatLists[0].scrollHeight - $chatLists.height();
        if ( scrollHeight > 0 ) {
            $chatLists.scrollTop( scrollHeight );
        }
    }

    /**
     *  返回按钮的事件
     */
    function handlerBack () {
        $chatroomForm.css( 'position', 'absolute' );
        $chatroomHeader.css( 'position', 'absolute' );
        $loginContainer.css( 'left', '0' );
        $chatroomContainer.css( 'left', '100%' );
        
        socket.emit( 'logout', { username: _username } );
        _username = '';
        $usernameInput.val( '' );
    }

    /**
     *  发送消息的按钮
     */
    function handlerSendMessage () {
        const message = $messageInput.val();
        socket.emit( 'sendMessage', { username: _username, message: message });
        $messageInput.val( '' );
    }

})( window, jQuery );
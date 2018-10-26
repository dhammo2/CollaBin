var API = 'lib/router.php';

/**
* We want to use the server time as this is what PHP uses
* Function Source: https://www.webdeveloper.com/forum/d/228309-getting-server-datetime-with-no-server-side-script
*/

var xmlHttp;
function srvTime(){
    try {
        //FF, Opera, Safari, Chrome
        xmlHttp = new XMLHttpRequest();
    }
    catch (err1) {
        //IE
        try {
            xmlHttp = new ActiveXObject('Msxml2.XMLHTTP');
        }
        catch (err2) {
            try {
                xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
            }
            catch (eerr3) {
                //AJAX not supported, use CPU time.
                alert("AJAX not supported");
            }
        }
    }
    xmlHttp.open('HEAD',window.location.href.toString(),false);
    xmlHttp.setRequestHeader("Content-Type", "text/html");
    xmlHttp.send('');
    return xmlHttp.getResponseHeader("Date");
}

/**
 * Saves a new paste
 */
function save() {
    var $textarea = $('#newpaste');
    var content = $textarea.val();
	
	// Get paste expiry information entered by user
    var sel = $("#paste_expiry").val();
	var sel = String(sel);
	
	// Create variable containing current date
	// var expD = new Date(); //Uncomment if you want client time
	var expD = srvTime();
	
	//Create expiry date
 	if (sel == '1d') {
		expD.setDate(expD.getDate()+1);
	} else if (sel == '3d') {
		expD.setDate(expD.getDate()+3);
	} else if (sel == '1w') {
		expD.setDate(expD.getDate()+7);
	} else if (sel == '2w') {
		expD.setDate(expD.getDate()+14);
	} else if (sel == '1m') {
		expD.setMonth(expD.getMonth()+1);
	} else if (sel == '3m') {
		expD.setMonth(expD.getMonth()+3);
	} else if (sel == '6m') {
		expD.setMonth(expD.getMonth()+6);
	} else if (sel == '1y') {
		expD.setYear(expD.getYear()+1);
	} else {
		expD.setYear(9999);
	}
	
	// Turn Date Format to String Format
	var dd = expD.getDate();
	var mm = expD.getMonth()+1;
	var yyyy = expD.getFullYear();
	
	// Get Day and Month in Full Format
	if (dd < 10) {
		dd = '0' + dd;
	}
	
	if (mm < 10) {
		mm = '0' + mm;
	}
	
	// Create expiry date string variable
	var expS = '' + dd + mm + yyyy;
	
    if (!content.length) return;

	//Send desired variables to JS script
    $.post(
        API,
        {
            do: 'save',
            'content': content,
			'expS': expS
        },
        function (data) {
            if (data === false) {
                alert('something went wrong');
                return;
            }
            $textarea.val('');
            location = location.pathname + '#' + data;
            location.reload()
        }
    )
}

/**
 * loads as paste from backend
 *
 * @param {String} uid
 */
function load(uid) {
    $.get(
        API,
        {
            do: 'load',
            uid: uid
        },
        function (data) {
            $('#paste').html(PR.prettyPrintOne(data, null, true)).addClass('prettyprint');
            $('#newpaste').html(data);
            loadcomments(uid);
        }
    );
}

/**
 * Loads all current comments for the paste
 *
 * @param {String} uid
 */
function loadcomments(uid) {
    $.get(
        API,
        {
            do: 'loadcomments',
            uid: uid
        },
        function (data) {
            var $lines = $('#paste').find('li');

            for (var i = 0; i < data.length; i++) {
                commentshow($($lines.get(data[i].line)), data[i]);
            }

            $lines.click(function (e) {
                if (e.target != this) return;
                commentform(uid, $(this));
                e.preventDefault();
                e.stopPropagation();
            });

            $('#help').show();
        }
    )
}

/**
 * Shows the given comment at the given line
 *
 * Makes sure the comment is shown before a possible comment edit form
 *
 * @param {jQuery} $li The line element
 * @param {Object} comment The comment text
 */
function commentshow($li, comment) {
    var $last = $li.children().last();

    var $comment = $('<div class="comment" style="border-color: #' + comment.color + '">' +
        '<div class="text"></div>' +
        '<div class="user"></div>' +
        '</div>');
    $comment.find('.text').text(comment.comment);
    $comment.find('.user').text(comment.user);

    if ($last.hasClass('newcomment')) {
        $last.before($comment);
    } else {
        $last.after($comment);
    }
}

/**
 * Saves the comment that has been entered in $form
 *
 * @param {String} uid
 * @param {jQuery} $form
 */
function commentsave(uid, $form) {
    var $txtarea = $form.find('textarea');
    var comment = $txtarea.val();
    if (!comment.length) return;

    var user = $.trim($form.find('input').val());
    if (user == '') {
        alert('Please enter a name to have your comments properly attributed');
        return;
    }

    $form.toggle();
    Cookies.set('user', user, { expires: 365 });

    $.post(
        API,
        {
            do: 'savecomment',
            uid: uid,
            comment: comment,
            line: $form.parent().index(),
            user: user
        },
        function (data) {
            if (!data) {
                alert('Something went wrong');
                return;
            }
            $txtarea.val('');
            commentshow($($form.parent()), data);
        }
    )
}

/**
 * Toggle comment form showing for the given line element
 *
 * @param {String} uid
 * @param {jQuery} $li
 */
function commentform(uid, $li) {
    var $form = $li.find('.newcomment');
    if (!$form.length) {
        $form = $('<div class="newcomment">' +
            '<textarea></textarea><br>' +
            '<label>Your Name: <input type="text"></label>' +
            '<button>Save</button>' +
            '</div>');
        $form.find('button').click(function (e) {
            commentsave(uid, $form);
            e.preventDefault();
            e.stopPropagation();
        });

        $li.append($form);
    } else {
        $form.toggle();
    }

    $form.find('input').val(Cookies.get('user'));
}


/**
 * Main
 */
$(function () {
    var $new = $('#new');
    $new.find('button').click(function (e) {
        save();
        e.preventDefault();
        e.stopPropagation();
    });
    $new.find('textarea').focus(function (e) {
        $(this).animate({height: '35em'}, 'fast');
    });


    if (location.hash.length) {
        load(location.hash.substr(1));
    }
});
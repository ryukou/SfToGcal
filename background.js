//http://retrorocket.biz/archives/131
//google処理
var clientId = '112069730763-4ar715rea9s19790iv61foqvio8psipj.apps.googleusercontent.com';
var apiKey = '2zweY4tV-wDiNlzvWXnBm7vm';
var scopes = [ 'https://www.googleapis.com/auth/plus.me',
		'https://www.googleapis.com/auth/calendar' ];
var googleCaenderId = 'vqurk7167h0vt6f62egj932cvs@group.calendar.google.com';
// rosawa01@gmail.com
// 1ivnj52d6o6l0ccdm1rf5frscs@group.calendar.google.com
// numblovers@gmail.com
// vqurk7167h0vt6f62egj932cvs@group.calendar.google.com
var SFDC_ID = 'SFDC_ID';
var google;
// var isWait = false;

function handleClientLoad() {

	try {
		// 予めAPI Consoleで設定したAPIキーを設定
		gapi.client.setApiKey(apiKey);

	} catch (e) {
		alert(e); // バグの内容をダイアログで表示する
		throw "error:cannot calculate"; // エラーの内容を記述する
	}

	// すでに認証済みかの確認をする。
	window.setTimeout(checkAuth, 1);
}

function checkAuth() {
	// immediateをtrueで指定することで、未認証の場合、ただちにエラーが返り、
	// handleAuthResultが呼び出される。
	gapi.auth.authorize({
		client_id : clientId,
		scope : scopes,
		immediate : true
	}, handleAuthResult);
}

function handleAuthResult(authResult) {
	var authorizeButton = document.getElementById('authorize-button');
	if (authResult && !authResult.error) {
		authorizeButton.style.visibility = 'hidden';
		makeApiCall();
	} else {
		authorizeButton.style.visibility = '';
		authorizeButton.onclick = handleAuthClick;
	}
}

function handleAuthClick(event) {
	// ここで、ポップアップ画面を表示して、OAuth認証を行う。
	gapi.auth.authorize({
		client_id : clientId,
		scope : scopes,
		immediate : false
	}, handleAuthResult);
	return false;
}
function start(tab) {
	if (!tab.url.match("https://(.*.salesforce.com)/.*/"))
		return;
	try {
		var searchCookie = {
			name : "sid",
			domain : "",
			path : "/",
			secure : true,
			session : true
		};
		searchCookie.domain = RegExp.$1;
		chrome.cookies
				.getAll(
						searchCookie,
						function(cookies) {
							if (cookies == null || cookies.length == 0) {
								var e = "クッキーエラー";
								alert(e); // バグの内容をダイアログで表示する
								throw e; // エラーの内容を記述する
							}
							var cookie = cookies[0];
							var conn = new jsforce.Connection({
								instanceUrl : "https://" + cookie.domain,
								accessToken : cookie.value
							});
							var nowdate = toDateFomatYYYYMMDD(new Date);
							var soqlStr = "SELECT  RecurrenceActivityId, RecurrenceDayOfMonth, RecurrenceDayOfWeekMask, RecurrenceInstance, RecurrenceInterval, RecurrenceMonthOfYear, RecurrenceTimeZoneSidKey, RecurrenceType, Id, Subject, Description, Location, StartDateTime, EndDateTime, IsAllDayEvent, SystemModstamp, IsPrivate, ShowAs, IsDeleted ,IsChild FROM Event WHERE StartDateTime >= "
									+ nowdate
									+ "T00:00:00.000Z ORDER BY StartDateTime ASC  LIMIT 50";
							var records = [];

							conn
									.queryAll(soqlStr)
									.on("record", function(record) {
										records.push(record);
									})
									.on(
											"end",
											function(query) {
												console
														.log("total in database : "
																+ query.totalSize
																+ " total fetched : "
																+ query.totalFetched);
												try {
													google = new OAuth2(
															'google',
															{ // 今回はGoogleのAPIにアクセスするためgoogleを指定
																client_id : clientId,
																client_secret : apiKey,
																api_scope : 'https://www.googleapis.com/auth/calendar', // スコープはGoogleカレンダー
																														// TODO
															// authBaseUri :
															// 'https://accounts.google.com/o/oauth2/auth',
															// redirectUri :
															// 'https://oauth2-login-demo.appspot.com/oauth/callback',
															});

													alert('認証します。');
													google
															.authorize(oyaEx(records));
												} catch (e) {
													alert('error' + e); // バグの内容をダイアログで表示する
													throw e; // エラーの内容を記述する
												}

											}).run({
										autoFetch : true,
										maxFetch : 4000
									});
						});

	} catch (e) {
		alert(e); // バグの内容をダイアログで表示する
		throw e; // エラーの内容を記述する
	}
}
var for_count = 0;
// var recordsSize = 0;
// var i = 1;
function oyaEx(records) {
	for_count = 0;
	// recordsSize = records.length;
	listGcal(records);
	// i = 1;
	// var last_promise = listGcal(records[for_count]);
	// alert('mae' + 0)
	// alert(records.length);
	// last_promise.then(function() {

	// while (for_count < records.length) {// TODO
	// alert(i+"vs"+for_count);
	// if (i == for_count + 1) {
	// alert("FORtrue");

	// last_promise = last_promise.then(listGcal(records[for_count]));
	// } else {
	// alert("FORfalse");
	// }
	// }
	// });
}

function mainGcal(record, listResult) {// 待機処理
// alert(record.Subject + ":" + record.Id);
	try {
		// if (isWait == false) {
		// clearInterval(timerID);
		if (record.RecurrenceActivityId != null) {// 繰り返しの親データ
			// alert("繰り返し親データ" + record.Subject);
			return;
		}
		// alert(record.Subject);
		// alert(record.RecurrenceActivityId);

		if (0 == listResult.items.length) {
			if (record.IsDeleted == true) {
				// 削除済みデータ
				// alert("削除済みデータ");
				return;
			}
			// alert("insert：" + listResult.items.length + record.Subject);
			insertGcal(record);
		} else if (1 == listResult.items.length) {
			var eventId = listResult.items[0].id;
			if (record.IsDeleted == false) {
				// alert("upd：" + listResult.items.length);
				updateGcal(eventId, record);
			} else {
				// alert("del：" + listResult.items.length);
				deleteGcal(eventId);
			}
		} else {
			// alert("件数：" + listResult.items.length)
			alert("スケジュールがすでに重複している。：" + listResult.items.length + "件:"
					+ record.Subject + "ID:" + record.Id);
			// alert(listResult.items[0].summary);
			// alert(listResult.items[1].summary);
			// alert(listResult.items[2].summary);
		}
		// i++;
		// }
	} catch (e) {
		console.log(e);
		// clearInterval(timerID);
		throw e;
	}
}

// var doSomething = function() {
// var defer = $.Deferred();
// setTimeout(function() {
// // defer.resolve(return); // 解決
// defer.reject(return); // 却下
// }, 2000);
// return defer.promise();
// };

// function listGcal(sfRecord) {
var listGcal = function(records) {
	// alert("リスト" + sfRecord.Id)
	if (records.length == for_count) {
		alert('終了：' + for_count);
		return;
	}
	var sfRecord = records[for_count];
	for_count++;

	if (sfRecord.IsChild == true) {// 子レコードは登録しないのでスキップ
		if (records.length == for_count) {
			alert('終了：' + for_count);
			return;
		}
		sfRecord = records[for_count];
		for_count++;
	}

	// 検索
	try {

		var body = JSON.stringify({
			"extendedProperties" : {
				"private" : {
					SFDC_ID : sfRecord.Id
				}
			}
		});
		body = null;
	} catch (e) {
		alert('検索データ作成失敗' + e);
	}

	// var promise = gcalRquest(body, 'GET',
	// "https://www.googleapis.com/calendar/v3/calendars/"
	// + googleCaenderId + "/events");
	var promise = gcalRquest(body, 'GET',
			"https://www.googleapis.com/calendar/v3/calendars/"
					+ googleCaenderId + "/events?privateExtendedProperty="
					+ SFDC_ID + "=" + sfRecord.Id);

	// ?privateExtendedProperty="+ SFDC_ID + "%3D" + sfRecord.Id
	// 1GET
	// https://www.googleapis.com/calendar/v3/calendars/1ivnj52d6o6l0ccdm1rf5frscs%40group.calendar.google.com/events?privateExtendedProperty=SFDC_ID%3D00U8000000ayOmPEAU&key={YOUR_API_KEY}
	promise.then(function(result) {
		mainGcal(sfRecord, result);
		listGcal(records);
		// alert("メイン終了");
	}, function(result) {
		alert('GET 失敗しました' + result);
	});

}
function insertGcal(sfRecord) {
	// alert("insert:" + sfRecord.Id)
	try {
		var startDatetime;
		var endDatetime;
		var body;
		if (sfRecord.IsAllDayEvent) {
			startDatetime = toDateFomatYYYYMMDD(toJpDate(sfRecord.StartDateTime));
			endDatetime = toDateFomatYYYYMMDD(toJpSyujituDate(sfRecord.StartDateTime));
			body = JSON.stringify({
				"extendedProperties" : {
					"private" : {
						SFDC_ID : sfRecord.Id
					}
				},
				"summary" : sfRecord.Subject,// タイトル
				"location" : sfRecord.Location,// 場所
				"description" : sfRecord.Description,// 詳細説明
				"status" : "confirmed",// ステータス
				// RFC3339形式で記述。日本時間なら2014-02-16T16:00:00+09:00
				// 終日設定の場合、YYYY-MM-DDのみで指定し、実際の終了日に+1する。
				"start" : {
					// "timezone":"Asia/Tokyo",
					"date" : startDatetime
				}, // 開始時間

				"end" : {
					"date" : endDatetime
				}
			// 終了時間
			});
		} else {
			startDatetime = toJpDate(sfRecord.StartDateTime)
			endDatetime = toJpDate(sfRecord.EndDateTime);
			body = JSON.stringify({
				"extendedProperties" : {
					"private" : {
						SFDC_ID : sfRecord.Id
					}
				},
				"summary" : sfRecord.Subject,// タイトル
				"location" : sfRecord.Location,// 場所
				"description" : sfRecord.Description,// 詳細説明
				"status" : "confirmed",// ステータス
				// RFC3339形式で記述。日本時間なら2014-02-16T16:00:00+09:00
				// 終日設定の場合、YYYY-MM-DDのみで指定し、実際の終了日に+1する。
				"start" : {
					"dateTime" : startDatetime
				}, // 開始時間

				"end" : {
					"dateTime" : endDatetime
				}
			// 終了時間
			});
		}

	} catch (e) {
		alert('登録データ作成' + e);
		throw e;

	}

	gcalRquest(body, 'POST',
			"https://www.googleapis.com/calendar/v3/calendars/"
					+ googleCaenderId + "/events");
}

function updateGcal(eventId, sfRecord) {
	// alert("更新" + sfRecord.Subject + "Id" + sfRecord.Id)
	// alert(sfRecord.RecurrenceActivityId + sfRecord.RecurrenceDayOfMonth
	// + sfRecord.RecurrenceDayOfWeekMask + sfRecord.RecurrenceInstance
	// + sfRecord.RecurrenceInterval + sfRecord.RecurrenceMonthOfYear
	// + sfRecord.RecurrenceTimeZoneSidKey + sfRecord.RecurrenceType
	// + sfRecord.Id + sfRecord.Subject + sfRecord.Description
	// + sfRecord.Location + sfRecord.StartDateTime + sfRecord.EndDateTime
	// + sfRecord.IsAllDayEvent + sfRecord.SystemModstamp
	// + sfRecord.IsPrivate + sfRecord.ShowAs + sfRecord.IsDeleted);
	try {
		var startDatetime;
		var endDatetime;
		var body;
		if (sfRecord.IsAllDayEvent) {
			startDatetime = toDateFomatYYYYMMDD(toJpDate(sfRecord.StartDateTime));
			endDatetime = toDateFomatYYYYMMDD(toJpSyujituDate(sfRecord.StartDateTime));
			body = JSON.stringify({
				"extendedProperties" : {
					"private" : {
						SFDC_ID : sfRecord.Id
					}
				},
				"summary" : sfRecord.Subject,// タイトル
				"location" : sfRecord.Location,// 場所
				"description" : sfRecord.Description,// 詳細説明
				"status" : "confirmed",// ステータス
				// RFC3339形式で記述。日本時間なら2014-02-16T16:00:00+09:00
				// 終日設定の場合、YYYY-MM-DDのみで指定し、実際の終了日に+1する。
				"start" : {
					"date" : startDatetime
				}, // 開始時間

				"end" : {
					"date" : endDatetime
				}
			// 終了時間
			});
		} else {
			startDatetime = toJpDate(sfRecord.StartDateTime)
			endDatetime = toJpDate(sfRecord.EndDateTime);

			body = JSON.stringify({
				"extendedProperties" : {
					"private" : {
						SFDC_ID : sfRecord.Id
					}
				},
				"summary" : sfRecord.Subject,// タイトル
				"location" : sfRecord.Location,// 場所
				"description" : sfRecord.Description,// 詳細説明
				"status" : "confirmed",// ステータス
				// RFC3339形式で記述。日本時間なら2014-02-16T16:00:00+09:00
				// 終日設定の場合、YYYY-MM-DDのみで指定し、実際の終了日に+1する。
				"start" : {
					"dateTime" : startDatetime
				}, // 開始時間

				"end" : {
					"dateTime" : endDatetime
				}
			// 終了時間
			});
		}
	} catch (e) {
		alert('更新データ作成' + e);
		throw e;

	}
	// PUT
	// https://www.googleapis.com/calendar/v3/calendars/calendarId/events/eventId
	gcalRquest(body, 'PUT', "https://www.googleapis.com/calendar/v3/calendars/"
			+ googleCaenderId + "/events/" + eventId);
}
function deleteGcal(eventId) {
	// DELETE
	// https://www.googleapis.com/calendar/v3/calendars/calendarId/events/eventId
	gcalRquest(null, 'DELETE',
			"https://www.googleapis.com/calendar/v3/calendars/"
					+ googleCaenderId + "/events/" + eventId);
}
function gcalRquest(body, method, uri) {
	// alert(method + ":" + uri + " body: " + body);

	var d = new $.Deferred;

	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {// 非同期
		if (xhr.readyState == 4) {
			isWait = false;
			var data = JSON.parse(xhr.responseText);
			if (xhr.status == 200) {
				// alert("リクエストに成功" + xhr.responseText);
				// return data;

				d.resolve(data);

			} else {
				var e = "(リクエストに失敗)" + xhr.status + " : " + data.error.code
						+ " : " + data.error.message + ":" + body;
				alert(e);
				d.reject(e);
				// throw e;
			}
		}
	};
	xhr.open(method, uri, true);

	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Authorization', 'Bearer ' + google.getAccessToken()); // アクセストークンの取得
	// if (body != null) {
	xhr.send(body);
	// }
	return d.promise();
}

function toJpDate(utcDate) {
	var d = new Date(utcDate);
	return new Date(d.setHours(d.getHours()));
}
function toJpSyujituDate(utcDate) {
	var d = new Date(utcDate);
	return new Date(d.setHours(d.getHours() + 4));
}

function toDateFomatYYYYMMDD(utcDate) {
	var da = new Date(utcDate);
	var y = da.getFullYear();
	var m = da.getMonth() + 1;
	var d = da.getDate();
	if (m < 10) {
		m = '0' + m;
	}
	if (d < 10) {
		d = '0' + d;
	}
	return y + "-" + m + "-" + d;
}

// アイコンがクリックされたときの処理
chrome.browserAction.onClicked.addListener(start);

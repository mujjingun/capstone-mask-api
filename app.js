const express = require('express')
const app = express()
const port = 8001

const https = require('https')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/list', function(req, res) {
    const options = {
        hostname: '8oi9s0nnth.apigw.ntruss.com',
        port: 443,
        path: `/corona19-masks/v1/storesByGeo/json?lat=${req.query.lat}&lng=${req.query.lng}&m=${req.query.acc}`,
        method: 'GET'
    }

    new Promise((resolve, reject) => {
        const call = https.request(options, response => {
            const body = [];
            response.on('data', (chunk) => body.push(chunk));
            response.on('end', () => resolve(body.join('')));
        })

        call.on('error', error => {
            reject("Error")
        })

        call.end()
    }).then((data) => res.send(data))
})

app.get('/', function(req, res) {
    res.send(`<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>마스크 판매소 안내</title>
    </head>
    <body>
        <div>
            <div>
                <div id="date"></div>
                <div>현재 위치를 선택하시면 근처의 공적마스크 판매소들이 보입니다.</div>
                <div id="map" style="width:100%;height:400px;"></div>
                <label for="radius">반경 (m): </label>
                <input type="number" id="radius">
            </div>
            <div>
                <div id="box"></div>
            </div>
        </div>
        <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=3f9425331cc87fcd283680b62ec9d1ab&libraries=drawing"></script>
        <script>
            var lat = 37.551737561286295;
            var lng = 126.94070010218512;
            var acc = 500;

            var notice = "마스크 5부제 실시! ";
            switch (new Date().getDay()) {
                case 0: notice += "오늘(일요일)은 주간에 구매하지 못한 분들이 구매하시는 날입니다."; break;
                case 1: notice += "오늘(월요일)은 생년 뒷자리가 1 또는 6인 분들이 구매하시는 날입니다."; break;
                case 2: notice += "오늘(화요일)은 생년 뒷자리가 2 또는 7인 분들이 구매하시는 날입니다."; break;
                case 3: notice += "오늘(수요일)은 생년 뒷자리가 3 또는 8인 분들이 구매하시는 날입니다."; break;
                case 4: notice += "오늘(목요일)은 생년 뒷자리가 4 또는 9인 분들이 구매하시는 날입니다."; break;
                case 5: notice += "오늘(금요일)은 생년 뒷자리가 5 또는 0인 분들이 구매하시는 날입니다."; break;
                case 6: notice += "오늘(토요일)은 주간에 구매하지 못한 분들이 구매하시는 날입니다."; break;
            }
            document.getElementById('date').innerHTML = notice;

            const box = document.getElementById('box');
            var markers = []

            function updateList() {
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                    if (this.readyState == 4 && this.status == 200) {
                        if (this.responseText === "Error") {
                            box.innerHTML = "에러"
                        }
                        else {
                            markers.forEach((m) => {
                                m.setMap(null)
                            });

                            box.innerHTML = this.responseText
                            var data = JSON.parse(this.responseText).stores
                            var text = ""
                            data.forEach((store) => {
                                var inner = "<div>" + store.name + "</div>"
                                inner += "<div>" + store.addr + "</div>"
                                var status = ""
                                if (store.remain_stat === "plenty") {
                                    status = '<span style="color: green">100개 이상</span>'
                                }
                                else if (store.remain_stat === "some") {
                                    status = '<span style="color: brown">30 ~ 100개</span>'
                                }
                                else if (store.remain_stat === "few") {
                                    status = '<span style="color: red">30개 미만</span>'
                                }
                                else if (store.remain_stat === "empty") {
                                    status = '<span style="color: grey">없음</span>'
                                }
                                else if (store.remain_stat === "break") {
                                    status = '<span style="color: grey">판매중지</span>'
                                }
                                inner += "<div>" + status + "</div>"
                                text += "<li>" + inner + "</li>"

                                var m = new kakao.maps.Marker({
                                    map: map,
                                    position: new kakao.maps.LatLng(store.lat, store.lng),
                                    draggable: false,
                                    title: store.name
                                });
                                markers.push(m)
                            })
                            box.innerHTML = "<ul>" + text + "</ul>"
                        }
                    }
                };
                xhttp.open("GET", "list?lat=" + lat + "&lng=" + lng + "&acc=" + acc, true);
                xhttp.send();
            }

            var container = document.getElementById('map');
            var options = {
                center: new kakao.maps.LatLng(lat, lng),
                level: 9
            };

            var map = new kakao.maps.Map(container, options);
            var manager = new kakao.maps.drawing.DrawingManager({
                map: map,
                drawingMode: [
                    kakao.maps.drawing.OverlayType.CIRCLE
                ],
                circleOptions: {
                    draggable: false,
                    removable: false,
                    editable: false,
                    strokeWeight: 2,
                    strokeOpacity: 0.8,
                    strokeColor: '#0000ff',
                    strokeStyle: 'longdash',
                    fillColor: '#ff00ff',
                    fillOpacity: 0.3
                }
            });
            var marker = new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(lat, lng),
                draggable: true
            });
            manager.put(
                kakao.maps.drawing.OverlayType.CIRCLE,
                new kakao.maps.LatLng(lat, lng),
                acc
            );

            function updateMap() {
                marker.setPosition(new kakao.maps.LatLng(lat, lng));
                manager.undo();
                manager.put(
                    kakao.maps.drawing.OverlayType.CIRCLE,
                    new kakao.maps.LatLng(lat, lng),
                    acc
                );
            }

            kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
                lat = mouseEvent.latLng.getLat()
                lng = mouseEvent.latLng.getLng()
                updateMap();
                updateList();
            });

            navigator.geolocation.getCurrentPosition(function(pos){
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
                acc = Math.min(pos.coords.accuracy, 1000);
                document.getElementById('radius').value = acc;
                map.setCenter(new kakao.maps.LatLng(lat, lng));
                updateMap();
                updateList();
            });

            document.getElementById('radius').addEventListener('input', function(e) {
                acc = Math.min(parseInt(e.target.value), 1000);
                updateMap();
                updateList();
            });

            updateList();
        </script>
    </body>
</html>`)
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

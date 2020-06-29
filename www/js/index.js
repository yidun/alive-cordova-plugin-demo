/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

function debugLog (msg) {
  const span = document.createElement('span');
  span.innerText = msg;
  document.getElementById('debug').append(span);
}

var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);

       this.$actionEl = document.getElementById('detectAction');
       this.$resultEl = document.getElementById('detectResult');
        
        this.detectTip = '';
				this.detectRes = {
					err: null,
					token: ''
        };
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        const detector = new YidunAliveDetect({
          x: 100,
          y: 100,
          width: 180,
          height: 240,
          radius: 90,
          businessId: '从易盾申请到的id'
        }, this.handleDetectCb.bind(this));
        
        document.getElementById('startDetectBtn').addEventListener('click', function () {
          detector.startDetect();
        });
        document.getElementById('stopDetectBtn').addEventListener('click', function () {
          detector.stopDetect();
        });
    },
    
    handleDetectCb: function (ev) {
      if (this.detectRes.token) return

      // 初始化活体检测引擎成功
      if (ev['init_success']) {
        return
      }
      // 检测提示
      if (ev['state_tip']) {
        // 用户可以根据action_type自定义提示文案
        this.$actionEl.innerText = `${YidunAliveDetect.DETECT_ACTION_TYPES[ev['action_type']]}--文案: ${ev['state_tip']}`
      } else {
        this.$actionEl.innerText = ''
      }
      // 检测结果
      if (ev['is_passed']) {
        this.$resultEl.innerText = ev['token']
        return this.detectRes = {
          err: null,
          token: ev['token']
        }
      }
      
      // 检测失败
      if (ev['error_code'] || ev['error_code'] === 0) {
        const err = new Error(`${ev['error_code']}: ${ev.msg}`);
        err.code = ev['error_code'];
        this.$resultEl.innerText = '检测失败';
        return this.detectRes = {
          err,
          token: ''
        }
      }
      
      if (ev['over_time']) {
        const err = new Error('检测超时');
        this.$resultEl.innerText = '检测超时';
        return this.detectRes = {
          err,
          token: ''
        }
      }
    }
};

app.initialize();

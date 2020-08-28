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

// ---------------- utils --------------------
function formatParams(data) {
  return Object.keys(data)
    .map(function (key) {
      return key + '=' + encodeURIComponent(data[key])
    })
    .join('&')
}

function getParams(query, key) {
  const params = query
    .slice(1)
    .split('&')
    .reduce(function (obj, item) {
      const param = item.split('=')
      obj[param[0]] = window.decodeURIComponent(param[1])
      return obj
    }, {})
  return key ? params[key] : params
}

// --------------------- const -----------------------
const DETECT_ACTION_TYPES = {
  '1': ['向右转头', 'turn_right'],
  '2': ['向左转头', 'turn_left'],
  '3': ['张张嘴', 'open_mouth'],
  '4': ['眨眨眼', 'open_eyes']
}

// --------------------- main ------------------------
var app = {
  // Application Constructor
  initialize: function () {
    document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    this.waitTimer = null;
    this.wrapper = null;
    this.curAction = {
      step: 1
    };
    this.enableAudio = false;
    this.restSec = 30;
    this.detector = null;
  },

  // deviceready Event Handler
  //
  // Bind any cordova events here. Common events are:
  // 'pause', 'resume', etc.
  onDeviceReady: function () {
    // 事件监听
    this.wrapper = document.getElementsByClassName('demo')[0];
    this.$audioBtn = document.querySelector('.j-audio');
    this.$tipEl = document.querySelector('.j-action-tip');
    this.$exceptionEl = document.querySelector('.j-exception-tip');
    this.$imgEl = document.querySelector('.j-action-img');
    this.$stepsEl = document.querySelector('.check-steps');
    this.$secsEl = document.querySelector('.j-secs');

    // 开始体验
    const checkBtn = document.querySelector('.j-trial');
    checkBtn.addEventListener('click', () => {
      this.changeStep(2);
    })

    this.$audioBtn.addEventListener('click', () => {
      this.enableAudio = !this.enableAudio
      this.$audioBtn.classList.toggle('open')
    })

    const backs = Array.prototype.slice.call(document.getElementsByClassName('j-back'), 0);
    backs.forEach((item) => {
      item.addEventListener('click', () => {
        history.pushState(
          {
            step: 1,
            type: ''
          },
          '',
          location.pathname + '?step=1'
        )
        this.changeStep(1);
      });
    });

    document.getElementById('copyToken').addEventListener('click', () => {
      cordova.plugins.clipboard.copy(document.getElementById('checkToken').value);
    });
  },
  changeStep: function (num, params) {
    // reset
    if (this.detector) {
      this.detector.removeDetect()
      this.detector = null
    }

    const step = num || parseInt(getParams(window.location.search, 'step'), 10) || 1;
    const result = document.querySelector('.result__body');
    result.className = 'result__body';
    const data = params || getParams(window.location.search);

    if (step === 1) {
      // 进入首页
    } else if (step === 2) {
      // 进入检测页
      this.$audioBtn.classList.remove('open');
      this.enableAudio = false;

      this.initAliveDetect()
    } else if (step === 3) {
      // 进入结果页
      let { isPassed, token } = data;
      isPassed = parseInt(isPassed, 10)
      const tokenEl = document.getElementById('checkToken');
      const msgEl = document.querySelector('.j-msg');
      const cls = isPassed ? 'success' : 'failed';
      tokenEl.value = token;
      msgEl.innerText = isPassed ? '活体检测通过' : '活体检测不通过';
      result.classList.add(cls);
    }

    const cls = this.wrapper.className.replace(/step-\d/, 'step-' + step);
    this.wrapper.className = cls;
    return step;
  },
  initAliveDetect: function () {
    this.curAction = {
      step: 1,
      type: ''
    };
    this.restSec = 30;
    this.$secsEl.innerText = this.restSec;
    this.$tipEl.innerText = '';
    this.$imgEl.src = './assets/open_eyes.gif';
    const steps = this.$stepsEl.children;
    for (let i = 0; i < steps.length; i++) {
      this.$stepsEl.children[i].classList.remove('active');
    }
    this.$stepsEl.children[0].classList.add('active');

    this.detector = new YidunAliveDetect({
      x: 60,
      y: 76,
      width: 252,
      height: 252,
      radius: 126,
      businessId: '从易盾申请的id',
      timeout: 30000,
      isDebug: false
    }, this.handleDetectCb.bind(this));
    this.detector.stopDetect();
    this.detector.startDetect();

    this.waitTimer = setInterval(() => {
      if (this.restSec <= 0) {
        clearInterval(this.waitTimer);
        this.waitTimer = null;
      } else {
        this.restSec = this.restSec - 1
        this.$secsEl.innerText = this.restSec
      }
    }, 1000);
  },
  handleDetectCb: function (ev) {
    if (typeof ev !== 'object') {
      return;
    }
    // 初始化活体检测引擎成功
    if (ev['init_success']) {
      return;
    }

    // 检测提示
    const actionType = ev['action_type'];
    if (ev['state_tip'] &&
      Object.keys(DETECT_ACTION_TYPES).includes(actionType) &&
      actionType !== this.curAction.type) {
      const hit = DETECT_ACTION_TYPES[actionType];
      if (actionType == '4') {
        this.curAction.type = actionType;
        this.$tipEl.innerText = hit[0];
      } else {
        this.curAction = {
          step: this.curAction.step + 1,
          type: actionType
        };
        this.$tipEl.innerText = hit[0];
        this.$imgEl.src = `./assets/${hit[1]}.gif`;
        const steps = this.$stepsEl.children;
        for (let i = 0; i < steps.length; i++) {
          this.$stepsEl.children[i].classList.remove('active');
        }
        this.$stepsEl.children[this.curAction.step - 1].classList.add('active');
      }
      this.playAudioIfEnable(hit[1]);
    }

    if ('exception_type' in ev) {
      // const EXCEPTION_TYPES = {
      //   1: '保持面部在框内',
      //   2: '环境光线过暗',
      //   3: '环境光线过亮',
      //   4: '请勿抖动手机'
      // }
      this.$exceptionEl.innerText = ev['exception_tip'];
    }
    // 检测结果
    if ('is_passed' in ev) {
      const params = {
        token: ev['token'],
        isPassed: ev['is_passed'] ? 1 : 0
      };
      history.pushState(
        { step: 3 },
        '',
        location.pathname + `?step=3&${formatParams(params)}`
      );
      this.changeStep(3, params);
      clearInterval(this.waitTimer)
      this.waitTimer = null
      return;
    }

    // 检测失败
    if (ev['error_code'] || ev['error_code'] === 0) {
      this.changeStep(1);
      clearInterval(this.waitTimer)
      this.waitTimer = null
      // 提示
    }

    if (ev['over_time']) {
      clearInterval(this.waitTimer)
      this.waitTimer = null
      navigator.notification.confirm(
        '请在规定时间内完成动作',
        (index) => {
          if (index === 1) {
            this.initAliveDetect()
          } else {
            this.changeStep(1)
          }
        },
        '请确认',
        ['重试', '返回首页']
      )
    }
  },
  playAudioIfEnable: function (name) {
    if (!this.enableAudio) return
    const src = navigator.platform === 'iphone' ? `assets/audio/${name}.wav` : `/android_asset/www/assets/audio/${name}.wav`
    const media = new Media(src, () => {
      console.log('success')
    }, (err) => {
      console.log(1, err)
    });
    media.play()
  }
};

app.initialize();

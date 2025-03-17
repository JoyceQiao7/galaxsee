class GalaxseeApp {
  constructor() {
    this.usernameLabel = document.querySelector('#username');
    this.galaxyPosition = document.querySelector('#galaxyPosition');
    this.scanButton = document.querySelector('#btn-scan');
    this.nearbyList = document.querySelector('#nearbyList');
    this.inboxList = document.querySelector('#inboxList');
    this.messageInputs = {};

    addEventListener('message', this.#onMessage);
    addEventListener('load', () => postWebViewMessage({ type: 'webViewReady' }));

    this.scanButton.addEventListener('click', () => {
      postWebViewMessage({ type: 'scanSpace' });
    });
  }

  #onMessage = (ev) => {
    if (ev.data.type !== 'devvit-message') return;
    const { message } = ev.data.data;

    switch (message.type) {
      case 'initialData':
        this.usernameLabel.innerText = message.data.username;
        this.galaxyPosition.innerText = `(${message.data.galaxy.positionX.toFixed(2)}, ${message.data.galaxy.positionY.toFixed(2)})`;
        this.updateInbox(message.data.inbox);
        break;
      case 'updateNearby':
        this.updateNearby(message.data.nearbyGalaxies);
        break;
      case 'signalResult':
        alert(message.data.success ? 'Signal sent!' : 'Signal lost in space.');
        break;
      case 'updateInbox':
        this.updateInbox(message.data.inbox);
        break;
    }
  };

  updateNearby(galaxies) {
    this.nearbyList.innerHTML = '';
    galaxies.forEach(g => {
      const li = document.createElement('li');
      li.innerHTML = `${g.userId} (${g.positionX.toFixed(2)}, ${g.positionY.toFixed(2)})`;
      const input = document.createElement('input');
      input.placeholder = 'Message';
      const sendBtn = document.createElement('button');
      sendBtn.innerText = 'Send Signal';
      sendBtn.onclick = () => {
        postWebViewMessage({ type: 'sendSignal', data: { receiverId: g.userId, message: input.value } });
        input.value = '';
      };
      li.appendChild(input);
      li.appendChild(sendBtn);
      this.nearbyList.appendChild(li);
    });
  }

  updateInbox(signals) {
    this.inboxList.innerHTML = '';
    signals.forEach(s => {
      const li = document.createElement('li');
      li.innerText = `${s.message} from ${s.senderId} at ${s.sentAt}`;
      this.inboxList.appendChild(li);
    });
  }
}

function postWebViewMessage(msg) {
  parent.postMessage(msg, '*');
}

new GalaxseeApp();
let timer = null;
let timeLeft = 0;

self.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'START':
            timeLeft = payload || timeLeft;
            if (!timer) {
                timer = setInterval(() => {
                    if (timeLeft > 0) {
                        timeLeft -= 1;
                        self.postMessage({ type: 'TICK', payload: timeLeft });
                    } else {
                        clearInterval(timer);
                        timer = null;
                        self.postMessage({ type: 'DONE' });
                    }
                }, 1000);
            }
            break;

        case 'PAUSE':
            clearInterval(timer);
            timer = null;
            break;

        case 'EXTEND':
            timeLeft += payload;
            self.postMessage({ type: 'TICK', payload: timeLeft });
            break;

        case 'RESET':
            clearInterval(timer);
            timer = null;
            timeLeft = payload || 0;
            self.postMessage({ type: 'TICK', payload: timeLeft });
            break;
            
        case 'SYNC':
            timeLeft = payload;
            break;
    }
};

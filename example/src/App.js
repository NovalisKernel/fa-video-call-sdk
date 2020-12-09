import React, { useState } from 'react';

import { ExampleComponent } from 'fa-video-call-sdk';
import 'fa-video-call-sdk/dist/index.css';

const App = () => {
  const [isOpened, setOpen] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Test
      </button>
      <ExampleComponent
        isOpened={isOpened}
        setOpen={setOpen}
        currentCallId="callId"
        url="ant-media-server-test.tk:5443"
        role="streamer"
        callType="oneToMany"
        apiUri="http://localhost:3001"
        turnServerCredentials={{
          username: 'username',
          credential: 'credential',
        }}
      />
    </div>
  );
};

export default App;

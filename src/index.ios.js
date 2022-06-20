import axios from 'axios';
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  NativeModules,
  NativeEventEmitter,
  Linking,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';

const LINKING_ERROR =
  `The package 'react-native-visit-health-rn' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const escapeChars = {
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  amp: '&',
};

const unescapeHTML = (str) =>
  // modified from underscore.string and string.js
  str.replace(/\&([^;]+);/g, (entity, entityCode) => {
    let match;

    if (entityCode in escapeChars) {
      return escapeChars[entityCode];
    } else if ((match = entityCode.match(/^#x([\da-fA-F]+)$/))) {
      return String.fromCharCode(parseInt(match[1], 16));
    } else if ((match = entityCode.match(/^#(\d+)$/))) {
      return String.fromCharCode(~~match[1]);
    } else {
      return entity;
    }
  });

const VisitHealthView = ({ source }) => {
  const VisitHealthRn = useMemo(
    () =>
      NativeModules.VisitHealthRn
        ? NativeModules.VisitHealthRn
        : new Proxy(
            {},
            {
              get() {
                throw new Error(LINKING_ERROR);
              },
            }
          ),
    []
  );

  const webviewRef = useRef(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const callSyncApi = useCallback(
    (data) =>
      axios
        .post(`${baseUrl}/users/data-sync`, data, {
          headers: {
            Authorization: authToken,
          },
        })
        .then((res) => console.log('callSyncData response,', res))
        .catch((err) => console.log('callSyncData err,', { err })),
    [baseUrl, authToken]
  );

  const callEmbellishApi = useCallback(
    (data) =>
      axios
        .post(`${baseUrl}/users/embellish-sync`, data, {
          headers: {
            Authorization: authToken,
          },
        })
        .then((res) => console.log('callEmbellishApi response,', res))
        .catch((err) => console.log('callEmbellishApi err,', { err })),
    [baseUrl, authToken]
  );

  useEffect(() => {
    const apiManagerEmitter = new NativeEventEmitter(VisitHealthRn);
    const subscription = apiManagerEmitter.addListener(
      'EventReminder',
      (reminder) => {
        if (reminder?.callSyncData && reminder?.callSyncData?.length) {
          callSyncApi(reminder?.callSyncData[0]);
        }
        if (reminder?.callEmbellishApi && reminder?.callEmbellishApi?.length) {
          callEmbellishApi(reminder?.callEmbellishApi[0]);
        }
      }
    );
    return () => {
      subscription.remove();
    };
  }, [VisitHealthRn, callEmbellishApi, callSyncApi]);

  const handleMessage = async (event) => {
    const data = JSON.parse(unescapeHTML(event.nativeEvent.data));
    const {
      method,
      type,
      frequency,
      timestamp,
      apiBaseUrl,
      authtoken,
      googleFitLastSync,
      gfHourlyLastSync,
      url,
    } = data;
    console.log('handleMessage data is', data);
    console.log(unescapeHTML(event.nativeEvent.data));
    switch (method) {
      case 'UPDATE_PLATFORM':
        webviewRef.current?.injectJavaScript('window.setSdkPlatform("IOS")');
        break;
      case 'CONNECT_TO_GOOGLE_FIT':
        VisitHealthRn?.connectToAppleHealth((res) => {
          if (res?.sleepTime || res?.numberOfSteps) {
            webviewRef.current?.injectJavaScript(
              `window.updateFitnessPermissions(true,${res?.numberOfSteps},${res?.sleepTime})`
            );
          } else {
            webviewRef.current?.injectJavaScript(
              'window.updateFitnessPermissions(true,0,0)'
            );
          }
        });
        break;
      case 'GET_DATA_TO_GENERATE_GRAPH':
        VisitHealthRn?.renderGraph(
          { type, frequency, timestamp },
          (err, results) => {
            if (err) {
              console.log('error initializing Healthkit: ', err);
              return;
            }
            if (results[0]) {
              console.log('results initializing Healthkit: ', results[0]);
              webviewRef.current?.injectJavaScript(`window.${results[0]}`);
            }
          }
        );
        break;
      case 'UPDATE_API_BASE_URL':
        if (!hasLoadedOnce) {
          console.log('apiBaseUrl is,', apiBaseUrl);
          setBaseUrl(apiBaseUrl);
          setAuthToken(authtoken);
          VisitHealthRn?.updateApiUrl({ googleFitLastSync, gfHourlyLastSync });
          setHasLoadedOnce(true);
        }
        break;

      case 'OPEN_PDF':
        Linking.openURL(url);
        break;
      case 'CLOSE_VIEW':
        break;

      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.webViewContainer}>
      <WebView
        ref={webviewRef}
        source={{ uri: source }}
        style={styles.webView}
        javascriptEnabled
        onMessage={handleMessage}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  webViewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webView: {
    flex: 1,
  },
});

export default VisitHealthView;

VisitHealthView.defaultProps = {
  source: '',
};

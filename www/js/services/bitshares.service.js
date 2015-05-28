bitwallet_services
.service('BitShares', function($translate, $q, $http, $rootScope, Setting, ENVIRONMENT) {
    var self = this;

    self.hashMD5 = function(value){
      if(!value || value.length==0)
      {
        return '';
      }
      return md5(value.toLowerCase());
    }

    self.derivePassword = function(password) {
      if ( !password ) {
        var deferred = $q.defer();
        deferred.resolve({'key':'', 'key_hash':''});
        return deferred.promise;
      }
      return self.pbkdf2(password, 'SALTEADO', 1000, 32);
    }

    self.pbkdf2 = function(password, salt, c, dkLen){

      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.pbkdf2(
        function(data){
          deferred.resolve(data);
        },
        function(error){
          deferred.reject(error);
        },
        password,
        salt,
        c,
        dkLen
      );
    
      return deferred.promise;
    }
    
    self.sha256 = function(value){
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.sha256(
        function(data){
          deferred.resolve(data.sha256);
        },
        function(error){
          deferred.reject(error);
        },
        value
      );
    
      return deferred.promise;
    }
    
    self.isValidBTSName = function(name){
      if(name===undefined || !name || name.length<1)
      {
        return {valid:false, title:'err.invalid_name', message:'err.enter_valid_name'};
      }
      // Check name is valid;
      var match = String(name).match(/^[a-z][a-z0-9\-]*[^\-]/g); // (?<!\-)
      if (!match || match.length==0 || match[0]!=name)
      {
        return {valid:false, title:'err.invalid_name', message:'err.valid_name_chars'};
      }
      return {valid:true};
    }

    self.requestSignature = function(keys, url, _body) {
      var deferred = $q.defer();

      var body  = _body || '';
      var path  = self.urlPath(url);
      var nonce = Math.floor(Date.now()/1000);

      window.plugins.BitsharesPlugin.requestSignature(
        function(data){
          var headers = {
            'ACCESS-KEY'       : keys.akey,
            'ACCESS-NONCE'     : nonce,
            'ACCESS-SIGNATURE' : data.signature,
          };
          deferred.resolve(headers);
        },
        function(error){
          deferred.reject(error);
        },
        keys.skey, 
        nonce,
        path,
        body
      );
    
      return deferred.promise;
    };

    self.mnemonicToMasterKey = function(words) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.mnemonicToMasterKey(
        function(data){
          deferred.resolve(data.masterPrivateKey);
        },
        function(error){
          deferred.reject(error);
        },
        words
      );

      return deferred.promise;
    };

    self.computeMemo = function(from, message, destination, mpk, account_mpk, memo_mpk, memo_index) {

      //console.log('-----computeMemo');
      //console.log(from); 
      //console.log(message); 
      //console.log(destination); 
      //console.log(mpk); 
      //console.log(account_mpk); 
      //console.log(memo_mpk); 
      //console.log(memo_index);

      var deferred = $q.defer();

      self.isValidPubkey(destination).then(function(res) {

        self.derivePrivate(mpk, account_mpk, memo_mpk, memo_index).then(function(child) {

          self.createMemo(from, destination, message, child.privkey).then(function(memo) {
            deferred.resolve(memo);
          }, function(err) {
            deferred.reject(err);
          });

        }, function(err) {
          deferred.reject(err);
        });

      }, function(err) {
        deferred.resolve();
      });

      return deferred.promise;
    }

    self.createMemo = function(fromPubkey, destPubkey, message, oneTimePriv) {

      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.createMemo(
        function(memo){
          deferred.resolve(memo);
        },
        function(err){
          deferred.reject(err);
        },
        fromPubkey,
        destPubkey,
        message,
        oneTimePriv
      );
    
      return deferred.promise;
    };

    self.decryptMemo = function(oneTimeKey, encryptedMemo, privKey) {

      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.decryptMemo(
        function(decryptedMemo){
          deferred.resolve(decryptedMemo);
        },
        function(error){
          deferred.reject(error);
        },
        oneTimeKey,
        encryptedMemo,
        privKey
      );
    
      return deferred.promise;
    };

    self.createMnemonic = function(entropy) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.createMnemonic(
        function(data){
          deferred.resolve(data.words);
        },
        function(error){
          deferred.reject(error);
        },
        entropy
      );
    
      return deferred.promise;
    };

    self.compactSignatureForMessage = function(msg, wif) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.compactSignatureForMessage(
        function(data){
          deferred.resolve(data.compactSignatureForHash);
        },
        function(error){
          deferred.reject(error);
        },
        msg, 
        wif
      );
    
      return deferred.promise;
    };

    self.recoverPubkey = function(msg, signature) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.recoverPubkey(
        function(data){
          deferred.resolve(data.pubKey);
        },
        function(error){
          deferred.reject(error);
        },
        msg, 
        signature
      );
    
      return deferred.promise;
    };


    self.createMasterKey = function() {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.createMasterKey(
        function(data){
          // deferred.resolve('xprv9s21ZrQH143K3ijyttwKLLMY5TXj9QxrGoEg8EbLpsSyNabQ4QrbMzFj5j5FPkc8m58AZrVo8TMH5XEYuL2bdWaD2yhgiF68f9vsMkSTkkS'); // nisman
          // NISMAN: addy:"DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo", pubkey:"DVS5YYZsZ7g1fSpPxmZcJifWJ2rmiXbUyJpEYSdNsVw738C88yvoy", 
          // deferred.resolve('xprv9s21ZrQH143K3PgEC8y59PEEkFN4mHz4tTo9uYCJQbAuLLfxLHLt9HegarddLEP9iGXKpcc2a6c9j8jPtHNZsKXKQpjdg1nuXqAsoQqv7E6');// matu
          
          //deferred.resolve('xprv9s21ZrQH143K28Eo8MEiEbchHxrSFDFMtb73UEh5htu9vzrqpReaeS5vmJHi7aipUb9ck3FTfoj3AQJhdWJ7HL6ywwsuYdMupmPv13osE5c'); // daniel-hadad
          
          deferred.resolve('xprv9s21ZrQH143K4TFHxN8wCgnPUTyaJb7QwVFtvXz8zeyaXZYtmLGamLekc9hQAKZCCh3MW5HrxsjN5rHuLcpqrohVS1YDz1ZZN1nocEm8383'); 
          // btc Bso7DduduMapkTDW7HNWXf5dMCcYcNdpXi
          
          // xprv9s21ZrQH143K4TFHxN8wCgnPUTyaJb7QwVFtvXz8zeyaXZYtmLGamLekc9hQAKZCCh3MW5HrxsjN5rHuLcpqrohVS1YDz1ZZN1nocEm8383 -> DVSM5HFFtCbhuv3xPfRPauAeQ5GgW7y4UueL
          
          // DVS3NGm7x7NNXLSTLpqGioTZx3e2gfjJG2Rq ??
          
          //deferred.resolve(data.masterPrivateKey);
        },
        function(error){
          deferred.reject(error);
        }
      );
    
      return deferred.promise;
    };

    self.extractDataFromKey = function(grandParent, parent, key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.extractDataFromKey(
        function(data){
          deferred.resolve(data);
        },
        function(error){
          deferred.reject(error);
        },
        grandParent,
        parent,
        key
      );

      return deferred.promise;
    };

    self.encryptString = function(data, password) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.encryptString(
        function(data){
          deferred.resolve(data.encryptedData);
        },
        function(error){
          deferred.reject(error);
        },
        data, 
        password
      );

      return deferred.promise;
    };

    self.decryptString = function(data, password) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.decryptString(
        function(data){
          deferred.resolve(data.decryptedData);
        },
        function(error){
          deferred.reject(error);
        },
        data, 
        password
      );

      return deferred.promise;
    };

    self.isValidPubkey = function(pubKey) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsIsValidPubkey(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        pubKey
      );

      return deferred.promise;
    };

    self.isValidKey = function(grandParent, parent, key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.isValidKey(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        grandParent,
        parent,
        key
      );

      return deferred.promise;
    };

    self.isValidWif = function(wif) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.isValidWif(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        wif
      );

      return deferred.promise;
    };

    self.derivePrivate = function(grandParent, parent, key, deriv) {
      var deferred = $q.defer();
      
      window.plugins.BitsharesPlugin.derivePrivate(
        function(data){
          deferred.resolve(data);
        },
        function(error){
          deferred.reject(error);
        }
        , grandParent
        , parent
        , key
        , deriv
      );

      return deferred.promise;
    };

    self.compactSignatureForHash = function(hash, key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.compactSignatureForHash(
        function(data){
          deferred.resolve(data.compactSignatureForHash);
        },
        function(error){
          deferred.reject(error);
        }
        , hash
        , key
      );

      return deferred.promise;
    };

    self.btsWifToAddress = function(wif) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsWifToAddress(
        function(data){
          deferred.resolve(data.addy);
        },
        function(error){
          deferred.reject(error);
        }
        , wif
      );

      return deferred.promise;
    };

    self.btsPubToAddress = function(pubkey) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsPubToAddress(
        function(data){
          deferred.resolve(data.addy);
        },
        function(error){
          deferred.reject(error);
        }
        , pubkey
      );

      return deferred.promise;
    };

    self.btsIsValidAddress = function(addy) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsIsValidAddress(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        addy
      );

      return deferred.promise;
    };

    self.btsIsValidPubkey = function(pubkey) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsIsValidPubkey(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        pubkey
      );

      return deferred.promise;
    };
    
    self.btcIsValidAddress = function(addy) {
      var deferred = $q.defer();

      deferred.resolve(true);
      // window.plugins.BitsharesPlugin.btcIsValidAddress(
      //   function(data){
      //     deferred.resolve(true);
      //   },
      //   function(error){
      //     deferred.reject(error);
      //   },
      //   addy
      // );

      return deferred.promise;
    };

    self.setTest = function(value) {
      
      if (typeof window.plugins.BitsharesPlugin.setTest === "function") { 
        window.plugins.BitsharesPlugin.setTest(value);
      }
      return;
    };

    self.urlPath = function(url) {
      if(url[0] == '/') return url;
      return url.substr(url.indexOf('/', url.indexOf('://')+3));
    }

    self.apiCall = function(keys, url, payload) {

      if (keys === undefined) {
        console.log('BitShares.apiCall keys are NULL and url='+url);
        return self.apiCallStub(url, payload);
      }

      var deferred = $q.defer();

      self.requestSignature(keys, url, payload).then(function(headers) {
        self.apiCallStub(url, payload, headers).then(function(res){
          deferred.resolve(res);
        }, function(err){
          deferred.reject(err);
        });
      }, function(err) {
        deferred.reject('Unable to sign request:' + JSON.stringify(err));
      });

      return deferred.promise;
    }

    self.apiCallStub = function(url, payload, _headers) {

      var deferred = $q.defer();
      console.log('Bitshares::apiCallStub ' + url);

      var req;

      var headers = _headers || {};

      console.log('HEADERS: ' + JSON.stringify(headers));
      
      if(payload !== undefined){
        req = $http.post(url, payload ,{timeout:ENVIRONMENT.timeout, headers:headers});
      }
      else{
        if(headers=={})
          req = $http.get(url, {timeout:ENVIRONMENT.timeout});
        else
          req = $http.get(url, {timeout:ENVIRONMENT.timeout, headers:headers});
      }

      req.success(function(res) {
        if(!angular.isUndefined(res.error))
          deferred.reject(res.error);
        else
          deferred.resolve(res);
      })
      .error(function(data, status, headers, config) {
        deferred.reject({data:data, status:status, headers:headers, config:config});
      });

      return deferred.promise;
    }

    self.searchAccount = function(query) {
      return self.apiCall(undefined, ENVIRONMENT.apiurl('/account/'+query+'?find=true') );
    }

    self.recordAdd = function(keys, content) {
      return self.apiCall(keys, ENVIRONMENT.apiurl('/record'), content);
    }

    self.recordList = function(keys, from) {
      var params = {};
      if( from !== undefined)
        obj['from']=from;

      var filter = '';
      if( Object.keys(obj).length !== 0 )
        filter = '?' + self.toQueryString(obj);

      return self.apiCall(keys, ENVIRONMENT.apiurl('/record'+filter));
    }

    // *************************************************** //
    // Exchange Service Api Calls ************************ //
    // *************************************************** //
    self.listExchangeTxs = function(keys, before, asset) {

      var obj = {};
      if( before !== undefined)
        obj['before']=before;
      if( asset !== undefined)
        obj['asset']=asset;

      var filter = '';
      if( Object.keys(obj).length !== 0 )
        filter = '?' + self.toQueryString(obj);

      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs'+filter) );
    }
    
    self.getExchangeTx = function(keys, txid) {
      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs/'+txid));
    }
    
    self.getSellQuote = function(asset, amount) {
      return self.getQuote('sell', asset, amount);
    }
    
    self.getBuyQuote = function(asset, amount) {
      return self.getQuote('buy', asset, amount);
    }
    
    // If xtx_id is defined, the rest of the parameters are useless.
    self.getQuote = function(buy_sell, asset, amount) {
      var assets    = asset.split('_');
      var url       = ENVIRONMENT.apiurl('/'+buy_sell+'/'+amount+'/'+assets[0]+'/'+assets[1]);
      return self.apiCall(undefined, url);
    }

    self.getReQuote = function(keys, xtx_id) {
      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs/' + xtx_id + '/requote'));
    }
    
    self.X_DEPOSIT    = 'deposit';
    self.X_WITHDRAW   = 'withdraw';
    self.X_BTC_PAY    = 'btc_pay';
    
    self.isDeposit      = function(ui_type){return ui_type==self.X_DEPOSIT;}
    self.isWithdraw     = function(ui_type){return ui_type==self.X_WITHDRAW;}
    self.isBtcPay       = function(ui_type){return ui_type==self.X_BTC_PAY;}
    self.isXtx          = function(tx){return [self.X_DEPOSIT, self.X_WITHDRAW, self.X_BTC_PAY].indexOf(tx.ui_type)>=0;}
    
    self.isXtxCompleted = function(tx){
      if(!self.isXtx(tx))
        return false;
      return tx.status == 'OK';
    }
    
    self.canCancelXTx = function(tx){
      if(!self.isXtx(tx))
        return false;
      return tx.status == 'WP';
    }

    self.hasXtxRateChanged = function(tx){
      if(!self.isXtx(tx))
        return false;
      return tx.status == 'RC';
    }
    
    self.isXtxPartiallyOrFullyPaid = function(tx){
      // if(!self.isXtx(tx))
      //   return false;
      var valid_status = ['FP', 'WT', 'RC', 'WC', 'PC', 'TG', 'SC', 'OK']; //, 'XX', 'RR', 'RF'];
      return valid_status.indexOf(tx.status)>=0;
    }

    self.notRateChanged = function(tx){
      // if(!self.isXtx(tx))
      //   return false;
      var valid_status = ['FP', 'WT', 'WC', 'PC', 'TG', 'SC', 'OK']; //, 'XX', 'RR', 'RF'];
      return valid_status.indexOf(tx.status)>=0;
    }
    
    // self.isXtxPending = function(tx){
    //   if(!self.isXtx(tx))
    //     return false;
    //   return tx.status == 'WP';
    // }
    
    self.acceptQuote = function(quote, signature, keys, address, extra_data) {
      return self.acceptReQuote(quote, signature, keys, address, extra_data, undefined)
    }

    self.acceptReQuote = function(quote, signature, keys, address, extra_data, xtx_id) {

      var payload = JSON.stringify({
        quote       : quote,
        signature   : signature, 
        destination : address,
        extra_data  : extra_data,
        xtx_id      : (xtx_id === undefined ? '' : xtx_id)
      });

      return self.apiCall(keys, ENVIRONMENT.apiurl('/accept'), payload);
    }
    
    self.wakeupXTx = function(keys, txid) {
      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs/'+txid+'/wakeup'));
    }

    self.cancelXTx = function(keys, txid) {
      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs/'+token+'/'+txid+'/cancel'));
    }
    
    self.refundXTx = function(keys, txid, refund_address) {
      var url = ENVIRONMENT.apiurl('/xtxs/'+txid+'/refund');
      var payload = JSON.stringify({
        refund_address : refund_address
      });
      return self.apiCall(keys, url, payload);
    }
    
    // *************************************************** //
    // Assets Operations Api Calls *********************** //

    self.toQueryString = function(obj) {
        var parts = [];
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                parts.push(encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]));
            }
        }
        var xx = parts.join("&");
        return xx;
    }
    
    self.getBalance = function(address, before, asset) {

      var obj = {};
      if( before !== undefined)
        obj['before']=before;
      if( asset !== undefined)
        obj['asset']=asset;

      var filter = '';
      if( Object.keys(obj).length !== 0 )
        filter = '?' + self.toQueryString(obj);

      return self.apiCall(undefined, ENVIRONMENT.apiurl('/addrs/'+address+filter));
    }
    
    self.new_ = function(from, to, amount, asset, memo, slate) {

      var url = ENVIRONMENT.apiurl('/txs/new');

      var payload = JSON.stringify({
        "asset" : asset,
        "from"  : [{
            "address" : from
        }],
        "to"    : [{
            "address" : to, 
            "amount"  : amount,
            "memo"    : memo,
            "slate"   : slate
        }]
      });

      console.log(JSON.stringify(payload));

      return self.apiCall(undefined, url, payload);
    }
    
    self.sendAsset = function(tx, secret) {
      var url = ENVIRONMENT.apiurl('/txs/send');

      var payload = JSON.stringify({
        'tx'      : tx, 
        'secret'  : secret
      });
      
      return self.apiCall(undefined, url, payload);
    }
    
    // *************************************************** //
    // Account Api Calls ********************************* //
    
    self.getAccount = function(name) {
      var url = ENVIRONMENT.apiurl('/account/'+name);
      return self.apiCall(undefined, url);
    }

    self.getSignupInfo = function() {
      var url = ENVIRONMENT.apiurl('/signup');
      return self.apiCall(undefined, url);
    }
    
    self.pushSignupInfo = function(message, signature, pubkey) {

      var url = ENVIRONMENT.apiurl('/signup');

      var payload = JSON.stringify({
        message   : message,
        signature : signature,
        pubkey    : pubkey
      });

      return self.apiCall(undefined, url, payload)
    }

    self.signing_up = false;
    // password
    self.signUp = function(privkey, pubkey){
      var deferred = $q.defer();

      if(self.signing_up==true){
        console.log('BitShares signup err  [singup in progress]');
        deferred.reject('singup in progress');
        return deferred.promise;
      }

      self.signing_up = true;

      self.getSignupInfo().then(function(res) {
        self.recoverPubkey(res.msg, res.signature).then(function(service_pubkey) {
          //console.log(pubkey);
          if( service_pubkey != ENVIRONMENT.apiPubkey ) {
            deferred.reject('invalid pub key');
            console.log('BitShares signup err  [invalid pub key]');
            self.signing_up = false;
            return;
          }
          self.compactSignatureForMessage(res.msg, privkey).then(function(signature) {

            self.pushSignupInfo(res.msg, signature, pubkey).then(function(res) {

              if( angular.isUndefined(res.access_key) || angular.isUndefined(res.secret_key) ) {
                self.signing_up = false;
                deferred.reject('invalid keys');
                console.log('BitShares signup err  [invalid keys]');
                return;
              }

              console.log('BitShares.signup:'+res.access_key);
              deferred.resolve({akey:res.access_key,skey:res.secret_key});

              self.signing_up = false;
              // account.access_key = res.access_key;
              // account.secret_key = res.secret_key;
              // Account.updateAccesKeys(account).then(function() {
              //   console.log('BitShares.getBackendToken:'+res.access_key);
              //   self.signing_up = false;
              //   deferred.resolve({akey:res.access_key,skey:res.secret_key});
              // }, function(err) {
              //   self.signing_up = false;
              //   deferred.reject(err);
              // });

            }, function(err) {
              console.log('signup err#1 ' + JSON.stringify(err));
              self.signing_up = false;
              deferred.reject(err);
            });

          }, function(err) {
            console.log('signup err#2 ' + JSON.stringify(err));
            self.signing_up = false;
            deferred.reject(err);
          });

        }, function(err) {
          console.log('signup err#3 ' + JSON.stringify(err));
          self.signing_up = false;
          deferred.reject(err);
        });

      }, function(err) {
        console.log('signup err#4 ' + JSON.stringify(err));
        self.signing_up = false;
        deferred.reject(err);
      });
      
      return deferred.promise;
    }

    self.registerAccount = function(keys, account) {
      var url = ENVIRONMENT.apiurl('/account');

      var payload = JSON.stringify({
        name        : account.name,
        pubkey      : account.pubkey
        //public_data : {avatar : account.avatar_hash}
      });

      var deferred = $q.defer();
      deferred.resolve('essssssssta biennnnnnnn');
      return deferred.promise;
      //return self.apiCall(keys, url, payload);
    }
    
    self.updateAccount = function(keys, addys, assets, account) {
      var url = ENVIRONMENT.apiurl('/txs/update_account');

      var payload = JSON.stringify({
        pay_from      : addys,
        pay_in        : assets, 
        name          : account.name
        //public_data   : {avatar : account.avatar_hash}
      });

      return self.apiCall(keys, url, payload);
    }
    
    self.sendTx = function(secret, tx) {
      var url = ENVIRONMENT.apiurl('/txs/send');
      var payload = JSON.stringify({
        secret      : secret,
        tx          : tx,
      });

      return self.apiCall(url, payload);
    }

    self.getBackendToken = function(address) {

      var deferred = $q.defer();

      Setting.get(Setting.BSW_TOKEN).then(function(res) {

        if(res !== undefined) {
          console.log('BitShares.getBackendToken:'+res.value);
          var tmp = res.value.split(';');
          deferred.resolve({akey:tmp[0],skey:tmp[1]});
          return;
        }

        self.getSignupInfo().then(function(res) {
          self.recoverPubkey(res.msg, res.signature).then(function(pubkey) {
            //console.log(pubkey);
            if( pubkey != ENVIRONMENT.apiPubkey ) {
              deferred.reject('invalid pub key');
              return;
            }
            self.compactSignatureForMessage(res.msg, address.privkey).then(function(signature) {

              self.pushSignupInfo(res.msg, signature, address.pubkey).then(function(res) {

                if( angular.isUndefined(res.access_key) || angular.isUndefined(res.secret_key) ) {
                  deferred.reject('invalid keys');
                  return;
                }

                Setting.set(Setting.BSW_TOKEN, [res.access_key, res.secret_key].join(';')).then(function() {
                  console.log('BitShares.getBackendToken:'+res.access_key);
                  deferred.resolve({akey:res.access_key,skey:res.secret_key});
                }, function(err) {
                  deferred.reject(err);
                });

              }, function(err) {
                deferred.reject(err);
              });

            }, function(err) {
              deferred.reject(err);
            });

          }, function(err) {
            deferred.reject(err);
          });

        }, function(err) {
          deferred.reject(err);
        });

      }, function(err) {
        deferred.reject(err); 
      });

      return deferred.promise;
    }

    return self;
});

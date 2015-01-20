bitwallet_controllers
.controller('HomeCtrl', function(T, Wallet, Scanner, AddressBook, $ionicActionSheet, $scope, $state, $http, $ionicModal, $rootScope, $ionicPopup, $timeout, $location, BitShares, $q) {

  $scope.scanQR = function() {
           
    Scanner.scan()
    .then(function(result) {
      if( !result.cancelled ) {

        if(result.privkey !== undefined)
        {
          $state.go('app.import_priv', {private_key:result.privkey});
          return;
        }
        
        var promises = [];
        //Pubkey scanned
        if(result.pubkey !== undefined) {
          //result.address = bitcoin.bts.pub_to_address(bitcoin.bts.decode_pubkey(result.pubkey));
          var p = BitShares.btsPubToAddress(result.pubkey)
          .then(function(addy){
            result.address = addy;
          })
          promises.push(p);
        }
        $q.all(promises).then(function() {
          $state.go('app.send', {address:result.address, amount:result.amount, asset_id:result.asset_id});
        })
      }
    }, function(error) {
      
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }

  $rootScope.$on('refresh-done', function(event, data) {
    $scope.$broadcast('scroll.refreshComplete');
  });

  $rootScope.$on('address-book-changed', function(event, data) {
    Wallet.onAddressBookChanged();
  });

  $scope.showActionSheet = function(tx) {
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>'+T.i('home.add_to_book')+'</b>' },
       { text: T.i('home.view_details') },
     ],
     cancelText: T.i('g.cancel'),
     cancel: function() {
          // add cancel code..
     },
     buttonClicked: function(index) {
       // Add to addressbook
       if(index==0) {
         // load current label
         $ionicPopup.prompt({
           title: T.i('home.add_to_book'),
           inputType: 'text',
           inputPlaceholder: T.i('home.address_name'),
           cancelText: T.i('g.cancel'),
           okText: T.i('g.save')
         }).then(function(name) {

           if(name === undefined)
              return;

           AddressBook.add(tx.address, name).then(function() {
             Wallet.loadAddressBook().then(function(){
               $rootScope.$emit('address-book-changed');
             });
             window.plugins.toast.show( T.i('home.save_successfull'), 'short', 'bottom');
           });

         });
      }
      // View transaction details
      else if(index==1) {
        $state.go('app.transaction_details', {tx_id:tx['tx_id']});
      }
      return true;
     }
   });
  }

  $scope.go = function ( path ) {
    console.log('location:'+path);
    $timeout(function () {
      $location.path(path);
    });
  };

  $scope.doRefresh = function() {
    $rootScope.refreshBalance(true);
  };
  
  $scope.loadMore = function() {
    //$scope.$broadcast('scroll.infiniteScrollComplete');
    return;
  };

  $scope.$on('$stateChangeSuccess', function() {
    //return;
    $scope.loadMore();
  });
  
  $scope.moreDataCanBeLoaded = function() {
    return false;
  };
  
});

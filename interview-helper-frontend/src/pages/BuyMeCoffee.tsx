const BuyMeCoffee = () => {
    

    const copyToClipboard = (text: string, btn: any) => {
        navigator.clipboard.writeText(text).then(() => {
        const message = document.getElementById('copied-message');
        message.classList.add('show');
        setTimeout(() => {
          message.classList.remove('show');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    }
   return (
      <div>
         <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
               {/*     <!-- Header --> */}{" "}
               <div className="p-6 text-center">
                  <h1 className="text-3xl font-bold text-gray-800">Buy Me a Coffee</h1>
                  <div className="h-1 w-24 blue-accent mx-auto mt-2 rounded-full"></div>
                  <p className="mt-4 text-gray-600">Support my work with a small donation!</p>
               </div>

               {/*     <!-- Payment Methods -->*/}{" "}
               <div className="px-6 pb-6 space-y-4">

                  {/*       <!-- PayPal -->*/}{" "}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-lg">
                     <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                        <i className="fab fa-paypal text-blue-500 text-2xl mr-3"></i>
                        <span className="font-medium">PayPal</span>
                     </div>
                     <div className="flex-grow w-full sm:w-auto">
                        <div className="flex items-center">
                           <a href="https://paypal.me/osenieniola" target="_blank" className="flex-grow px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors text-center truncate">
                              paypal.me/osenieniola
                           </a>
                            <button className="copy-btn ml-2 p-2 rounded-full relative" onClick={()=> copyToClipboard('https://paypal.me/osenieniola', this)}>
                              <i className="far fa-copy text-gray-500"></i>
                              <span className="tooltip -top-10 -left-2">Copy address</span>
                           </button>
                        </div>
                     </div>
                  </div>

                  {/*       <!-- Bitcoin -->*/}{" "}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-lg">
                     <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                        <i className="fab fa-bitcoin text-orange-500 text-2xl mr-3"></i>
                        <span className="font-medium">BTC Address</span>
                     </div>
                     <div className="flex-grow w-full sm:w-auto">
                        <div className="flex items-center">
                           <div className="flex-grow px-4 py-2 bg-gray-50 rounded text-gray-700 border text-sm truncate">bc1qlm96596azsdf82al4qc4nmv6e9j5gnpuqdjsaj</div>
                           <button className="copy-btn ml-2 p-2 rounded-full relative" onClick={()=> copyToClipboard('bc1qlm96596azsdf82al4qc4nmv6e9j5gnpuqdjsaj', this)}>
                              <i className="far fa-copy text-gray-500"></i>
                              <span className="tooltip -top-10 -left-2">Copy address</span>
                           </button>
                        </div>
                     </div>
                  </div>

                  {/*       <!-- USDT -->*/}{" "}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-lg">
                     <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                        <i className="fa-solid fa-dollar-sign text-green-500 text-2xl mr-3"></i>
                        <span className="font-medium">USDT(BSC) Address</span>
                     </div>
                     <div className="flex-grow w-full sm:w-auto">
                        <div className="flex items-center">
                           <div className="flex-grow px-4 py-2 bg-gray-50 rounded text-gray-700 border text-sm truncate">0xb797dE59a2c7EC9941780F7551aE79D1fd789a87</div>
                           <button className="copy-btn ml-2 p-2 rounded-full relative" onClick={()=> copyToClipboard('0xb797dE59a2c7EC9941780F7551aE79D1fd789a87', this)}>
                              <i className="far fa-copy text-gray-500"></i>
                              <span className="tooltip -top-10 -left-2">Copy address</span>
                           </button>
                        </div>
                     </div>
                  </div>

                  {/*       <!-- Solana -->*/}{" "}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-lg">
                     <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                        <i className="fa-solid fa-s text-purple-500 text-2xl mr-3 font-bold"></i>
                        <span className="font-medium">Solana Address</span>
                     </div>
                     <div className="flex-grow w-full sm:w-auto">
                        <div className="flex items-center">
                           <div className="flex-grow px-4 py-2 bg-gray-50 rounded text-gray-700 border text-sm truncate">2WMXrvh9j9ftf2W57AGryidCBn8FXCTXYoqURPqceeis</div>
                            <button className="copy-btn ml-2 p-2 rounded-full relative" onClick={()=> copyToClipboard('2WMXrvh9j9ftf2W57AGryidCBn8FXCTXYoqURPqceeis', this)}>
                              <i className="far fa-copy text-gray-500"></i>
                              <span className="tooltip -top-10 -left-2">Copy address</span>
                           </button>
                        </div>
                     </div>
                  </div>

                  {/*       <!-- Add a new Plooto payment method section after the Solana section -->*/}{" "}
                {/*   <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 border rounded-lg">
                     <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                        <i className="fa-solid fa-wallet text-blue-600 text-2xl mr-3"></i>
                        <span className="font-medium">Plooto</span>
                     </div>
                     <div className="flex-grow w-full sm:w-auto">
                        <div className="flex items-center">
                           <div className="flex-grow px-4 py-2 bg-gray-50 rounded text-gray-700 border text-sm truncate">
                              <div className="mb-2">
                                 <input type="text" id="plooto-api-key" placeholder="Plooto API Key" className="w-full p-2 border rounded mb-2" />
                                 <input type="password" id="plooto-api-secret" placeholder="Plooto API Secret" className="w-full p-2 border rounded" />
                              </div>
                              <div className="flex items-center mt-2">
                                 <input type="checkbox" id="remember-plooto" className="mr-2" />
                                 <label for="remember-plooto" className="text-sm text-gray-600">
                                    Remember my credentials
                                 </label>
                              </div>
                           </div>
                           <button className="blue-accent ml-2 p-2 px-4 text-white rounded relative" onClick={processPlootoPayment}>
                              Pay
                           </button>
                        </div>
                     </div>
                  </div> */}

                  {/*       <!-- Copied Message -->*/}{" "}
                  <div className="copied-message text-center text-green-500 font-medium" id="copied-message">
                     Copied to clipboard!
                  </div>
               </div>

               {/*     <!-- Footer -->*/}{" "}
               <div className="px-6 pb-6 text-center text-sm text-gray-500">
                  <p>Thank you for your support!</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default BuyMeCoffee;

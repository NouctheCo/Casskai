import React from 'react';

import { motion } from 'framer-motion';



interface LoadingFallbackProps {

  message?: string;

}



export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message }) => {

  return (

    <div className="flex h-screen w-screen items-center justify-center flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">



      {/* Loading content */}

      <div className="relative z-10 flex flex-col items-center">

        {/* Logo */}

        <motion.div

          className="mb-8"

          animate={{ 

            scale: [1, 1.05, 1]

          }}

          transition={{ 

            duration: 2, 

            repeat: Infinity, 

            ease: "easeInOut" 

          }}

        >

          <img src="/logo.png" alt="CassKai" className="h-16 w-auto" />

        </motion.div>



        {/* Loading spinner */}

        <div className="relative">

          <motion.div

            className="w-12 h-12 border-4 border-blue-500/30 rounded-full"

            animate={{ rotate: 360 }}

            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}

          />

          <motion.div

            className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full"

            animate={{ rotate: 360 }}

            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}

          />

        </div>



        {/* Loading dots */}

        <div className="flex space-x-2 mt-6">

          {[0, 1, 2].map((i) => (

            <motion.div

              key={i}

              className="w-2 h-2 bg-blue-500 rounded-full dark:bg-blue-900/20"

              animate={{ 

                scale: [1, 1.5, 1],

                opacity: [0.5, 1, 0.5] 

              }}

              transition={{ 

                duration: 1, 

                repeat: Infinity, 

                delay: i * 0.2,

                ease: "easeInOut" 

              }}

            />

          ))}

        </div>



        {/* Message */}

        {message && (

          <motion.p

            className="text-gray-600 dark:text-gray-400 dark:text-gray-400 text-sm mt-4 text-center max-w-xs"

            initial={{ opacity: 0, y: 10 }}

            animate={{ opacity: 1, y: 0 }}

            transition={{ delay: 0.5 }}

          >

            {message}

          </motion.p>

        )}



        {/* Default loading message */}

        <motion.p

          className="text-gray-500 dark:text-gray-500 dark:text-gray-400 text-xs mt-2 text-center"

          initial={{ opacity: 0 }}

          animate={{ opacity: 1 }}

          transition={{ delay: 1 }}

        >

          Chargement de CassKai...

        </motion.p>

      </div>

    </div>

  );

};



export default LoadingFallback;

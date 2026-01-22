"use client"
import { useState } from "react"
import { LoginForm } from "@/components/feature/LoginForm"
import { RegisterForm } from "@/components/feature/RegisterForm"
import { motion, AnimatePresence } from "framer-motion"

export default function Home() {
  const [view, setView] = useState<'login' | 'register'>('login')

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-muted/20 selection:bg-primary selection:text-primary-foreground">
      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
             <LoginForm onRegisterClick={() => setView('register')} />
          </motion.div>
        ) : (
          <motion.div 
             key="register"
             initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
             animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
             exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
             transition={{ duration: 0.3, ease: "easeInOut" }}
             className="w-full"
          >
             <RegisterForm onCancel={() => setView('login')} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

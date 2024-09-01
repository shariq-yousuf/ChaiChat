/* === Imports === */
//                                                                                 // import { getAnalytics } from "firebase/analytics"
import "./index.css"
import { initializeApp } from "firebase/app"
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth"

/* === Firebase Setup === */
const firebaseConfig = {
  apiKey: "AIzaSyCMk0RrBozlUEbDlcVlfGqfR1MJLb6u7j8",
  authDomain: "moody-7df10.firebaseapp.com",
  projectId: "moody-7df10",
  storageBucket: "moody-7df10.appspot.com",
  appId: "1:251233526924:web:fe4da7397615bc3c8a47a9",
}

//                                                                                  //const analytics = getAnalytics(app)
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()

/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view")
const viewLoggedIn = document.getElementById("logged-in-view")
const signInWithGoogleButtonEl = document.getElementById(
  "sign-in-with-google-btn"
)
const emailInputEl = document.getElementById("email-input")
const passwordInputEl = document.getElementById("password-input")
const signInButtonEl = document.getElementById("sign-in-btn")
const createAccountButtonEl = document.getElementById("create-account-btn")
const signOutButtonEl = document.getElementById("sign-out-btn")
const userProfilePictureEl = document.getElementById("user-profile-picture")
const userGreetingEl = document.getElementById("user-greeting")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)
signInButtonEl.addEventListener("click", authSignInWithEmail)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)
signOutButtonEl.addEventListener("click", authSignOut)

/* === Main Code === */

onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInView()
    showProfilePicture(userProfilePictureEl as HTMLImageElement, user)
    showUserGreeting(userGreetingEl, user)
  } else {
    showLoggedOutView()
  }
})

/* === Functions === */

/* = Functions - Firebase - Authentication = */

async function authSignInWithGoogle() {
  try {
    await signInWithPopup(auth, provider)
    console.log("Sign in with Google")
  } catch (error) {
    console.error("Sign in with Google failed:", getErrorMessage(error))
  }
}

async function authSignInWithEmail() {
  const email = (emailInputEl as HTMLFormElement).value
  const password = (passwordInputEl as HTMLFormElement).value

  try {
    await signInWithEmailAndPassword(auth, email, password)

    clearAuthFields()
  } catch (error) {
    console.error("Sign in failed:", getErrorMessage(error))
  }
}

async function authCreateAccountWithEmail() {
  const email = (emailInputEl as HTMLFormElement).value
  const password = (passwordInputEl as HTMLFormElement).value

  try {
    await createUserWithEmailAndPassword(auth, email, password)

    sendEmailVerification(auth.currentUser)
    clearAuthFields()
  } catch (error) {
    console.error("Sign up failed:", getErrorMessage(error))
  }
}

async function authSignOut() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Sign out failed:", getErrorMessage(error))
  }
}

/* == Functions - UI Functions == */

function showLoggedOutView() {
  hideElement(viewLoggedIn)
  showElement(viewLoggedOut)
}

function showLoggedInView() {
  hideElement(viewLoggedOut)
  showElement(viewLoggedIn)
}

function showElement(element: HTMLElement) {
  element.style.display = "flex"
}

function hideElement(element: HTMLElement) {
  element.style.display = "none"
}

function clearInputField(field: HTMLElement) {
  ;(field as HTMLFormElement).value = ""
}

function clearAuthFields() {
  clearInputField(emailInputEl)
  clearInputField(passwordInputEl)
}

function showProfilePicture(imgElement: HTMLImageElement, user: User) {
  imgElement.src = user.photoURL
    ? user.photoURL
    : "assets/images/default-profile-picture.jpeg" // default image
}

function showUserGreeting(element: HTMLElement, user: User) {
  element.innerHTML = user.displayName
    ? `کیا حال ہے؟ ،<span class="user-name">${
        user.displayName.split(" ")[0]
      }</span> السلام علیکم`
    : `السلام علیکم دوست، کیا حال ہے؟`
}

/* == Utils == */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

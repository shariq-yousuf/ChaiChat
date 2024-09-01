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
  updateProfile,
} from "firebase/auth"
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  FieldValue,
} from "firebase/firestore"

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
const db = getFirestore(app)

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
const displayNameInputEl = document.getElementById("display-name-input")
const photoURLInputEl = document.getElementById("photo-url-input")
const updateProfileButtonEl = document.getElementById("update-profile-btn")
const updateProfileContainer = document.getElementById(
  "update-profile-container"
)
const toggleUpdateProfileSectionBtn = document.getElementById(
  "toggle-update-profile-section-btn"
)
const updateErrorEl = document.getElementById("update-error")
const signErrorEl = document.getElementById("sign-error")
const textareaEl = document.getElementById("post-input")
const postButtonEl = document.getElementById("post-btn")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)
signInButtonEl.addEventListener("click", authSignInWithEmail)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)
signOutButtonEl.addEventListener("click", authSignOut)
updateProfileButtonEl.addEventListener("click", authUpdateProfile)
toggleUpdateProfileSectionBtn.addEventListener(
  "click",
  toggleUpdateProfileSection
)
postButtonEl.addEventListener("click", postButtonPressed)

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
    signErrorEl.textContent = getErrorMessage(error)
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
    signErrorEl.textContent = getErrorMessage(error)
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
    signErrorEl.textContent = getErrorMessage(error)
  }
}

async function authSignOut() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error("Sign out failed:", getErrorMessage(error))
  }
}

async function authUpdateProfile() {
  const updatedInfo = {
    displayName: (displayNameInputEl as HTMLInputElement).value,
    photoURL: (photoURLInputEl as HTMLInputElement).value,
  }

  if (updatedInfo.displayName) {
    try {
      await updateProfile(auth.currentUser, updatedInfo)

      location.reload()
    } catch (error) {
      console.error("Updating profile failed:", getErrorMessage(error))
      updateErrorEl.textContent = getErrorMessage(error)
    }
  }
}

/* = Functions - Firebase - Cloud Firestore = */

async function addPostToDB(postBody: string, user: User) {
  interface Post {
    body: string
    uid: string
    createdAt: FieldValue
  }

  const post: Post = {
    body: postBody,
    uid: user.uid,
    createdAt: serverTimestamp(),
  }

  try {
    await addDoc(collection(db, "posts"), post)
  } catch (error) {
    console.error("Error adding document: ", getErrorMessage(error))
  }
}

/* == Functions - UI Functions == */

function postButtonPressed() {
  const postBody = (textareaEl as HTMLTextAreaElement).value
  const user = auth.currentUser

  if (postBody) {
    addPostToDB(postBody, user)
    clearInputField(textareaEl)
  }
}

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

function toggleUpdateProfileSection() {
  updateProfileContainer.classList.toggle("show")
}

/* == Utils == */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

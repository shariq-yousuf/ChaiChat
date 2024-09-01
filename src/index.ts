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
  DocumentData,
  onSnapshot,
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
const userSection = document.querySelector(".user-section")
const postSection = document.querySelector(".post-container")
const toggleSectionsBtn = document.getElementById("toggle-sections-btn")
const signErrorEl = document.getElementById("sign-error")
const updateErrorEl = document.getElementById("update-error")
const postErrorEl = document.getElementById("post-error")
const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn")
const textareaEl = document.getElementById("post-input")
const postButtonEl = document.getElementById("post-btn")
const postsEl = document.getElementById("posts")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)
signInButtonEl.addEventListener("click", authSignInWithEmail)
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)
signOutButtonEl.addEventListener("click", authSignOut)
updateProfileButtonEl.addEventListener("click", authUpdateProfile)
toggleSectionsBtn.addEventListener("click", toggleSectionsView)
for (let moodEmojiEl of moodEmojiEls) {
  moodEmojiEl.addEventListener("click", selectMood)
}
postButtonEl.addEventListener("click", postButtonPressed)

/* === State === */

let moodState = 4

/* === Global Constant === */

const collectionName = "posts"

/* === Main Code === */

onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInView()
    showProfilePicture(user)
    showUserGreeting(user)
    fetchInRealtimeAndRenderPostsFromDB()
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

      showProfilePicture(auth.currentUser)
      showUserGreeting(auth.currentUser)
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
    mood: number
  }
  const post: Post = {
    body: postBody,
    uid: user.uid,
    createdAt: serverTimestamp(),
    mood: moodState,
  }

  try {
    await addDoc(collection(db, collectionName), post)
  } catch (error) {
    console.error("Error adding document: ", getErrorMessage(error))
  }
}

function fetchInRealtimeAndRenderPostsFromDB() {
  onSnapshot(collection(db, collectionName), (querySnapshot) => {
    clearAll(postsEl)

    querySnapshot.forEach((doc) => renderPost(doc.data()))
  })
}

/* == Functions - UI Functions == */

function renderPost(postData: DocumentData) {
  postsEl.innerHTML += `
      <div class="post">
        <div class="header">
          <h3>${displayDate(postData.createdAt)}</h3>
          <img src="assets/emojis/${postData.mood}.png" />
        </div>
        <p>
          ${replaceNewlinesWithBrTags(postData.body)}
        </p>
      </div>  
  `
}

function replaceNewlinesWithBrTags(inputString: string) {
  return inputString.replaceAll(/\n/g, "<br>")
}

function postButtonPressed() {
  const postBody = (textareaEl as HTMLTextAreaElement).value
  const user = auth.currentUser

  if (postBody && moodState) {
    addPostToDB(postBody, user)
    clearInputField(textareaEl)
    resetAllMoodElements()
    postErrorEl.textContent = ""
  } else {
    postErrorEl.textContent = "Please write your feeling and select mood! 🙂"
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

function showProfilePicture(user: User) {
  ;(userProfilePictureEl as HTMLImageElement).src = user.photoURL
    ? user.photoURL
    : "assets/images/default-profile-picture.jpeg" // default image
}

function showUserGreeting(user: User) {
  userGreetingEl.innerHTML = user.displayName
    ? `کیا حال ہے؟ ،<span class="user-name">${
        user.displayName.split(" ")[0]
      }</span> السلام علیکم`
    : `السلام علیکم دوست، کیا حال ہے؟`
}

function toggleSectionsView() {
  userSection.classList.toggle("show")
  postSection.classList.toggle("hide")

  if (postSection.classList.contains("hide")) {
    toggleSectionsBtn.textContent = "Feed"
  } else {
    toggleSectionsBtn.textContent = "Profile"
  }
}

function displayDate(firebaseDate: DocumentData) {
  if (!firebaseDate) {
    return "Date processing..."
  }

  const date = firebaseDate.toDate()

  const day = date.getDate()
  const year = date.getFullYear()

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const month = monthNames[date.getMonth()]

  let hours = date.getHours().toString().padStart(2, 0)
  let minutes = date.getMinutes().toString().padStart(2, 0)
  // hours = hours < 10 ? "0" + hours : hours
  // minutes = minutes < 10 ? "0" + minutes : minutes

  return `${day} ${month} ${year} - ${hours}:${minutes}`
}

/* = Functions - UI Functions - Mood = */

function selectMood(event: Event) {
  const selectedMoodEmojiElementId = (event.currentTarget as HTMLInputElement)
    .id

  changeMoodsStyleAfterSelection(selectedMoodEmojiElementId)

  const chosenMoodValue = returnMoodValueFromElementId(
    selectedMoodEmojiElementId
  )

  moodState = chosenMoodValue
}

function changeMoodsStyleAfterSelection(selectedMoodElementId: string) {
  for (let moodEmojiEl of moodEmojiEls) {
    if (selectedMoodElementId === moodEmojiEl.id) {
      moodEmojiEl.classList.remove("unselected-emoji")
      moodEmojiEl.classList.add("selected-emoji")
    } else {
      moodEmojiEl.classList.remove("selected-emoji")
      moodEmojiEl.classList.add("unselected-emoji")
    }
  }
}

function resetAllMoodElements() {
  for (let moodEmojiEl of moodEmojiEls) {
    moodEmojiEl.classList.remove("selected-emoji")
    moodEmojiEl.classList.remove("unselected-emoji")
  }

  moodState = 0
}

function returnMoodValueFromElementId(elementId: string) {
  return Number(elementId.slice(5))
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function clearAll(element: HTMLElement) {
  element.innerHTML = ""
}

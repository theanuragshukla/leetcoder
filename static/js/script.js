const setProfile = (obj) => {
	document.getElementById('avatar').setAttribute('src', obj.userAvatar)
	document.getElementById('username').innerText=obj.username
}

const statsMarkup = (arr) => {
	const markup = `
		<h2>Problems Stats</h2>
		${
			arr.map(obj=>{
				return `
					<div><span>${obj.difficulty}</span><span>${obj.count}</span></div>
				`
			}).join(" ")
		}

	`
	return markup
}

const setStats = (obj) => {
	document.getElementById("stats").innerHTML=statsMarkup(obj)
}
const getProfile = async() => {
	fetch("/getProfile")
	.then((res)=>{
		return res.json()
	})
	.then((data)=>{
		setProfile(data)
	})
}

const getStats = async() => {
	fetch("/getStats")
	.then((res)=>{
		return res.json()
	})
	.then((data)=>{
		setStats(data)
	})
}
window.onload = () => {
	getProfile()
	getStats()
}

const submitForm =(e)=>{
	e.innerText='Please Wait...'
	const email = document.getElementById("email").value

	fetch('/submitForm',{
		method:'POST',
		body:JSON.stringify({
			email:email
		}),
		headers: {
			'Accept': 'application/json, text/plain, */*',
			'Content-Type': 'application/json'
		},
	})
		.then(res=>res.json())
		.then(res=>{
			if(res.status===true){
				alert('form submitted successfully!!')
				location.href='/'
			}else if(res.invalid===true){
				alert('please enter valid email')
			}else if(res.dup===true){
				alert('You are already registered!!')
			}else{
				alert('some error occoured')
			}
		})
		.catch(err=>{
			console.log(err)
			alert('something unexpected happened')
		})
	return false
}

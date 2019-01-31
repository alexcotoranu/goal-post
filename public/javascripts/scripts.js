// $(document).ready(function(){
//     var user,pass;
//     $("#submit").click(function(){
//         user=$("#user").val();
//         pass=$("#password").val();
//         $.post("http://localhost:3000/login",{user: user,password: pass}, function(data){
//             if(data==='done')
//             {
//                 alert("login success");
//             }
//         });
//     });
// });

// $(document).ready(function(){
//     $('#search').on('keyup', function(e){
//       if(e.keyCode === 13) {
//         var parameters = { search: $(this).val() };
//           $.get( '/searching',parameters, function(data) {
//           $('#results').html(data);
//         });
//        };
//     });
// });

// $(document).ready(function(){
//     var parameters = { search: $(this).val() };
//     $.get( '/projects',parameters, function(data) {
//         $('#projects').html(data);
//     });
// });
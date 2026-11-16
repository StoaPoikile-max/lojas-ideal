(function(){
  var $=function(id){return document.getElementById(id);};
  var q=new URLSearchParams(location.search);
  var status=(q.get("status")||q.get("collection_status")||"").toLowerCase();
  var tipo={credit_card:"cartão de crédito",debit_card:"cartão de débito",bank_transfer:"Pix",ticket:"boleto",account_money:"saldo Mercado Pago"}[q.get("payment_type")]||"";
  var ref=q.get("external_reference")||"", pagamento=q.get("payment_id")||q.get("collection_id")||"";
  var pedido=null; try{ pedido=JSON.parse(localStorage.getItem("ideal_pedido")); }catch(e){}

  var aprovado=status==="approved", pendente=status==="pending"||status==="in_process";
  if(!aprovado && !pendente){
    $("titulo").textContent="O pagamento não foi concluído";
    $("texto").textContent="Nada foi cobrado. Sua sacola continua salva: você pode tentar de novo ou fechar o pedido pelo WhatsApp.";
    $("voltar").hidden=false; return;
  }

  var situacao=aprovado?"Pagamento aprovado":"Pagamento aguardando confirmação";
  var msg="Olá, Lojas Ideal! Fiz um pedido pelo site.\n"+
    (ref?"Pedido: "+ref+"\n":"")+
    situacao+(tipo?" ("+tipo+")":"")+(pagamento?" · nº "+pagamento:"")+"\n\n"+
    (pedido&&pedido.resumo?pedido.resumo.replace(/^Olá[^\n]*\n/,""):"");
  var link="https://wa.me/"+LOJA.whatsapp+"?text="+encodeURIComponent(msg);

  $("titulo").textContent=aprovado?"Pagamento aprovado. Obrigado!":"Pedido recebido. Falta o pagamento cair.";
  $("texto").textContent=aprovado
    ?"Vamos te levar para o WhatsApp da loja para confirmar a retirada ou combinar a entrega."
    :"Boleto e alguns Pix levam um tempo para confirmar. Mande a mensagem abaixo no WhatsApp para a gente já separar suas peças.";
  if(pedido&&pedido.resumo){ $("resumo").textContent=msg; $("resumo").hidden=false; }
  $("zap").href=link; $("zap").hidden=false;
  try{ localStorage.removeItem("ideal_sacola"); }catch(e){}

  var s=5;
  var t=setInterval(function(){
    $("contagem").textContent="Abrindo o WhatsApp em "+s+" s…";
    if(s--<=0){ clearInterval(t); $("contagem").textContent="Se o WhatsApp não abriu, toque no botão verde."; location.href=link; }
  },1000);
})();

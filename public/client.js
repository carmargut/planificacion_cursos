"use strict";

var usuario = "",
    password = "",
    pagina_actual = 1,
    id_curso,
    enter = 13,
    semana = [
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
        "domingo"
    ],
    semana_dias = {},
    margen = 0;

$(document).ready(function() {
    // DOM inicializado
    esconderTodo();

    $("#link_portal_de_cursos").click(abrirPortalDeCursos);

    $("#link_buscar_cursos").on("click", abrirBuscarCursos);

    $("#boton_login").on("click", abrirLogin);

    $("#boton_logout").on("click", logout);

    $("#link_nuevo_usuario").click(abrirNuevoUsuario);

    $("#boton_login_enviar").on("click", procesarLogin);

    $("#boton_nuevo_usuario_enviar").on("click", procesarNuevoUsuario);

    $("#boton_buscar_cursos").on("click", buscar_cursos);

    $("#boton_inscribirse").on("click", inscribirse);

    $("#link_mis_cursos").on("click", abrirMisCursos);

    $("#semana_anterior").on("click", bajar_semana);

    $("#semana_siguiente").on("click", subir_semana);

});













/*
    FUNCIONES DE VISIBILIDAD DE PARTES DE LA PÁGINA
    ________________________________________________
*/

function esconderTodo() {
    margen = 0;
    $(".a_ocultar").hide();
    if (estaLogueado()) {
        $("#boton_logout").show();
        $("#link_mis_cursos").show();
    }
    $("#link_buscar_cursos").parent().removeClass("active");
    $("#link_mis_cursos").parent().removeClass("active");
    limpiarBusquedas(true, true);
}

function abrirBuscarCursos() {
    esconderTodo();
    $("#input_buscar_cursos").keypress(function(e) {
        if (e.which === enter) { // si pulsa enter
            buscar_cursos();
        }
    });
    $("#link_buscar_cursos").parent().addClass("active");
    $("#buscar_cursos").show();
}

function abrirMisCursos() {
    esconderTodo();
    $("#link_mis_cursos").parent().addClass("active");
    mostrarCursosInscrito();
    rellenarDias(margen);
    mostrarTablaHorarios();
    $("#mis_cursos").show();
}

function abrirLogin() {
    esconderTodo();
    $("#formulario_login input").keypress(function(e) {
        if (e.which === enter) { // si pulsa enter
            procesarLogin();
        }
    });
    $("#formulario_login input[type=email]").val("");
    $("#formulario_login input[type=email]").val("");
    $("#login").show();
}

function abrirNuevoUsuario() {
    esconderTodo();
    vaciarFormularioRegistro();
    $("#nuevo_usuario").show();
    $("#nuevo_usuario input").keypress(function(e) {
        if (e.which === enter) { // si pulsa enter
            procesarNuevoUsuario();
        }
    });
}

function abrirPortalDeCursos() {
    esconderTodo();
}

function mostrarMensajeDeInformación(tipo, mensaje) {
    //se quita el tipo de mensaje que pueda haber anteriormente
    $("#mensaje_de_informacion div").removeClass("alert-info alert-danger alert-success alert-warning");
    //se hace visible
    $("#mensaje_de_informacion").show();
    switch (tipo) { //dependiendo del tipo de mensaje sale un color u otro
        case "danger":
            $("#mensaje_de_informacion div").addClass("alert-danger");
            break;
        case "info":
            $("#mensaje_de_informacion div").addClass("alert-info");
            break;
        case "success":
            $("#mensaje_de_informacion div").addClass("alert-success");
            break;
        case "warning":
            $("#mensaje_de_informacion div").addClass("alert-warning");
            break;
    }
    // se añade el contenido del mensaje y la x al final para ocultar el mensaje
    $("#mensaje_de_informacion div").text(mensaje).append("<a id=\"boton_cerrar\" class=\"cerrar\">&times;</a>");
    $("#boton_cerrar").on("click", function() { // se añade funcionalidad a la x de ocultar el mensaje
        $("#mensaje_de_informacion").hide()
    });
}

function vaciarFormularioRegistro() {
    $("#formulario_nuevo_usuario input[type=email]").val("");
    $("#formulario_nuevo_usuario input[type=password]").val("");
    $("#nombre").val("");
    $("#apellidos").val("");
    $("#fechaDeNacimiento").val("");
}

function limpiarBusquedas(limpiar_buscador, limpiar_paginado) {

    $("#tabla").remove();
    if (limpiar_buscador) { // si queremos vaciar la barra de búsqueda
        $("#input_buscar_cursos").val("");
    }
    if (limpiar_paginado) { // si queremos quitar los números de página
        $("#lista_paginas").remove();
    }
}

function mostrarModal() {
    id_curso = $(this).attr('id');
    $.ajax({
        method: "GET",
        url: "/getCurso/" + id_curso,
        success: function(data, textStatus, jqXHR) {
            if (estaVacio(data.curso.imagen)) {
                $("#foto").hide();
            } else {
                $("#foto").show();
                $("#foto").attr("src", "https://localhost:5555/imagen/" + id_curso);
            }
            $("#modal_titulo").text(data.curso.titulo);
            $("#modal_descripcion").text(data.curso.descripcion);
            $("#modal_direccion").text(data.curso.direccion);
            $("#modal_localidad").text(data.curso.localidad);
            $("#modal_duracion").text("Empieza el " + new Date(data.curso.fecha_inicio).toLocaleDateString() +
                " y termina el " + new Date(data.curso.fecha_finalizacion).toLocaleDateString());
            $("#modal_horario").text();
            var texto_vacantes = data.curso.plazas + " (" + data.curso.vacantes + " vacante";
            texto_vacantes += data.curso.vacantes !== 1 ? "s)" : ")";
            $("#modal_plazas").text(texto_vacantes);
            if (data.curso.vacantes === 0 && estaLogueado() || esAnteriorAHoy(data.curso.fecha_finalizacion))
                $("#boton_inscribirse").hide();
            else if (estaLogueado())
                $("#boton_inscribirse").show();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            mostrarMensajeDeInformación("danger", "Ha habido un error obteniendo la información del curso.");
        }
    });
    $.ajax({
        method: "GET",
        url: "/getHorario/" + id_curso,
        success: function(data, textStatus, jqXHR) {
            var texto_horario = "",
                primero = true;
            data.horario.forEach(function(elem) {
                if (!primero) texto_horario += ", ";
                else primero = false;
                texto_horario += elem.dia_semana + ": " + elem.hora_inicio.slice(0, 5) + "-" + elem.hora_finalizacion.slice(0, 5);
            });
            $("#modal_horario").text(texto_horario);
        }
    });
}

function mostrarCursosInscrito() {
    $.ajax({
        method: "GET",
        url: "/getCursos/" + usuario,
        beforeSend: function(req) {
            req.setRequestHeader("Authorization", "Basic " + btoa(usuario + ":" + password));
        },
        success: function(data, textStatus, jqXHR) {
            $("#tabla_proximos_cursos").show();
            $("#cuerpo_tabla_proximos_cursos").remove();
            $("#tabla_proximos_cursos").append("<tbody id=\"cuerpo_tabla_proximos_cursos\"></tbody>");
            data.cursos.forEach(function(elem) {
                if (esPosteriorAHoy(elem.fecha_inicio)) {
                    $("#cuerpo_tabla_proximos_cursos").append("<tr> <td>" +
                        elem.titulo + "</td> <td>" +
                        elem.localidad + "</td> <td>" +
                        new Date(elem.fecha_inicio).toLocaleDateString() + "</td> <td>" +
                        new Date(elem.fecha_finalizacion).toLocaleDateString() + "</td> </tr>"
                    );
                }
            });
            $("#tabla_cursos_terminados").show();
            $("#cuerpo_tabla_cursos_terminados").remove();
            $("#tabla_cursos_terminados").append("<tbody id=\"cuerpo_tabla_cursos_terminados\"></tbody>");
            data.cursos.forEach(function(elem) {
                if (esAnteriorAHoy(elem.fecha_inicio)) {
                    $("#cuerpo_tabla_cursos_terminados").append("<tr> <td>" +
                        elem.titulo + "</td> <td>" +
                        elem.localidad + "</td> <td>" +
                        new Date(elem.fecha_inicio).toLocaleDateString() + "</td> <td>" +
                        new Date(elem.fecha_finalizacion).toLocaleDateString() + "</td> </tr>"
                    );
                }
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            mostrarMensajeDeInformación("danger", "Hemos tenido un error al buscar tus cursos.");
        }
    });
}

function rellenarDias(margen) {
    semana_dias = {};
    semana_dias.lunes = getLunes(sumarDia(new Date(), margen));
    semana_dias.martes = sumarDia(semana_dias.lunes, 1);
    semana_dias.miercoles = sumarDia(semana_dias.martes, 1);
    semana_dias.jueves = sumarDia(semana_dias.miercoles, 1);
    semana_dias.viernes = sumarDia(semana_dias.jueves, 1);
    semana_dias.sabado = sumarDia(semana_dias.viernes, 1);
    semana_dias.domingo = sumarDia(semana_dias.sabado, 1);
}

function mostrarTablaHorarios() {
    $.ajax({
        method: "GET",
        url: "/tabla/" + usuario + "/" + semana_dias.lunes + "/" + semana_dias.domingo,
        beforeSend: function(req) {
            req.setRequestHeader("Authorization", "Basic " + btoa(usuario + ":" + password));
        },
        success: function(data, textStatus, jqXHR) {
            if (data.horas_distintas !== 0) {
                $("#cuerpo_tabla_horario").remove();
                $("#tabla_horario").append("<tbody id=\"cuerpo_tabla_horario\"></tbody>");
                var lineas = data.horas_distintas + 1;
                for (var i = 0; i <
                    lineas; i++) {
                    if (i === 0) {
                        pintarLinea(data, "00:00:00", data.horas[i], i, "00:00-" + data.horas[i].slice(0, 5));
                    } else if (i === lineas - 1) {
                        pintarLinea(data, data.horas[i - 1], "24:00:00", i, data.horas[i - 1].slice(0, 5) + "-24:00");
                    } else {
                        pintarLinea(data, data.horas[i - 1], data.horas[i], i, data.horas[i - 1].slice(0, 5) + "-" + data.horas[i].slice(0, 5));
                    }
                }
            }
            $("#semana_mostrada").text(semana_dias.lunes.toLocaleDateString() + " - " + semana_dias.domingo.toLocaleDateString());
        },
        error: function(jqXHR, textStatus, errorThrown) {
            mostrarMensajeDeInformación("info", "Error obteniendo los horarios de los cursos.");
        }
    });
}

function pintarLinea(data, hora_incio, hora_fin, fila, lateral) {
    $("#cuerpo_tabla_horario").append("<tr id=\"cuerpo_tabla_horario_fila" + fila + "\"></tr>");
    $("#cuerpo_tabla_horario_fila" + fila).append("<td>" + lateral + " </td>");
    for (var i = 0; i < 7; i++) {
        var relleno = false,
            cursos_en_esta_posicion = new Array(); // por si se solapan los cursos el mismo día a la misma hora
        data.datos.forEach(function(curso) {
            if (curso.dia_semana === semana[i]) { // buena semana
                //la semana es despues de la fecha de inicio
                if (Date.parse(semana_dias[curso.dia_semana]) >= Date.parse(curso.fecha_inicio)) {
                    if (Date.parse(semana_dias[curso.dia_semana]) <= Date.parse(curso.fecha_finalizacion)) {
                        var cfin = parseInt(curso.hora_finalizacion) + Number(curso.hora_finalizacion.slice(3, 5)) / 100,
                            cinicio = parseInt(curso.hora_inicio) + Number(curso.hora_inicio.slice(3, 5)) / 100,
                            tinicio = parseInt(hora_incio) + Number(hora_incio.slice(3, 5)) / 100,
                            tfin = parseInt(hora_fin) + Number(hora_fin.slice(3, 5)) / 100;
                        if (tinicio >= cinicio && tfin <= cfin) { // buena Hora
                            if ($("#cuerpo_tabla_horario_fila" + fila + i).length > 0) { // está ocupado
                                if (cursos_en_esta_posicion.indexOf(curso.titulo) === -1) { // el curso no está escrito
                                    $("#cuerpo_tabla_horario_fila" + fila + i).append(", " + curso.titulo);
                                    cursos_en_esta_posicion.push(curso.titulo);
                                }
                            } else {
                                $("#cuerpo_tabla_horario_fila" + fila).append("<td id=\"cuerpo_tabla_horario_fila" + fila + i + "\" class=\"info borde-oscuro\">" + curso.titulo + "</td>");
                                cursos_en_esta_posicion.push(curso.titulo);
                            }
                            relleno = true;
                        }
                    }
                }
            }
        });
        if (!relleno)
            $("#cuerpo_tabla_horario_fila" + fila).append("<td></td>");
    }
}

















/*
    FUNCIONES DE ACTIVIDAD
    ___________________________
*/


function procesarLogin() {
    var email = $("#formulario_login input[type=email]").prop("value"); //capturamos el email
    var pass = $("#formulario_login input[type=password]").prop("value"); //capturamos la password
    if (!isEmail(email)) { //si el campo email está vacío o es inválido
        mostrarMensajeDeInformación("danger", "Introduce un email válido");
    } else if (estaVacio(pass)) { //si el campo password está vacío
        mostrarMensajeDeInformación("danger", "Introduce una contraseña");
    } else {
        $.ajax({
            method: "POST",
            url: "/login",
            beforeSend: function(req) {
                req.setRequestHeader("Authorization", "Basic " + btoa(email + ":" + pass));
            },
            success: function(data, textStatus, jqXHR) {
                login(email, pass);
                $("#formulario_login input[type=email]").val("");
                $("#formulario_login input[type=password]").val("");
            },
            error: function(jqXHR, textStatus, errorThrown) {
                $("#formulario_login input[type=password]").val("");
                mostrarMensajeDeInformación("danger", "Usuario o contraseña incorrectos");
            }
        });
    }
}

function procesarNuevoUsuario() {
    var email = $("#formulario_nuevo_usuario input[type=email]").prop("value"), //capturamos el email
        pass = $("#formulario_nuevo_usuario input[type=password]").prop("value"), //capturamos la password
        nombre = $("#nombre").prop("value"), //capturamos el nombre
        apellidos = $("#apellidos").prop("value"), //capturamos los apellidos
        fechaDeNacimiento = $("#fechaDeNacimiento").val(), // capturamos la fecha de nacimiento
        sexo = $("#optradio_hombre").prop("checked") ? "hombre" : "mujer";
    if (!isEmail(email)) { //si el campo email está vacío o es inválido
        mostrarMensajeDeInformación("danger", "Introduce un email válido");
    } else if (estaVacio(pass)) { //si el campo pass está vacío
        mostrarMensajeDeInformación("danger", "Introduce una contraseña");
    } else if (estaVacio(nombre)) { //si el campo nombre está vacío
        mostrarMensajeDeInformación("danger", "Introduce un nombre");
    } else if (estaVacio(apellidos)) { //si el campo apellidos está vacío
        mostrarMensajeDeInformación("danger", "Introduce tus apellidos");
    } else if (!esFechaValida(fechaDeNacimiento)) { //si el campo fechaDeNacimiento está vacío o presenta errores
        mostrarMensajeDeInformación("danger", "Introduce una fecha correcta");
    } else { // todo ha ido correctamente
        $.ajax({
            method: "POST",
            url: "/nuevoUsuario",
            data: {
                email: email,
                password: pass,
                nombre: nombre,
                apellidos: apellidos,
                fechaDeNacimiento: fechaDeNacimiento,
                sexo: sexo
            },
            success: function(data, textStatus, jqXHR) {
                abrirLogin();
                mostrarMensajeDeInformación("success", "¡Te has registrado!");
                $("#formulario_login input[type=email]").val(email);
                vaciarFormularioRegistro();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                mostrarMensajeDeInformación("danger", "No se ha podido registrar. Prueba a introducir otro email diferente.");
            }
        });
    }
}

function buscar_cursos() {
    if (estaVacio($("#input_buscar_cursos").prop("value"))) { // si no ha introducido nada en la barra de búsqueda o son todo espacios
        $("#tabla_buscar_cursos").hide();
        limpiarBusquedas(false, true); //se limpian las búsquedas y los números de página
        mostrarMensajeDeInformación("warning", "Introduce algo en la barra de búsqueda.");
    } else {
        $("#tabla_buscar_cursos").show();
        var primera_pagina = ($(this).children().text() === "");
        if (primera_pagina) { // es la primera vez que buscamos, así que mostramos la primera página
            pagina_actual = 1;
        } else { //el usuario ha pulsado en otra página
            $("#lista_paginas_" + pagina_actual).removeClass("active"); //se desmarca la página que antes era la actual
            pagina_actual = Number($(this).children().text()); //se captura el nuevo número de página
            $("#lista_paginas_" + pagina_actual).addClass("active"); //se destaca la nueva página
        }
        $.ajax({
            method: "GET",
            url: "/buscarPorNombre",
            data: {
                str: $("#input_buscar_cursos").prop("value"),
                num: 5,
                pos: (5 * (pagina_actual)) - 4
            },
            success: function(data, textStatus, jqXHR) {
                limpiarBusquedas(false, primera_pagina); //se limpian las búsquedas anteriores en caso de que las hubiese
                if (data.numero_total === 0) //si no se ha encontrado nada en la BBDD
                    mostrarMensajeDeInformación("info", "No se ha encontrado nada.");
                else { //muestra los resultados de la búsqueda
                    $("#tabla_buscar_cursos").append("<tbody id=\"tabla\"></tbody>");
                    data.resultado.forEach(function(elem) {
                        $("#tabla").append("<tr id=\"" + elem.id + "\" data-toggle=\"modal\" data-target=\"#modal\"> <td>" +
                            elem.titulo + "</td> <td>" +
                            elem.localidad + "</td> <td>" +
                            new Date(elem.fecha_inicio).toLocaleDateString() + "</td> <td>" +
                            new Date(elem.fecha_finalizacion).toLocaleDateString() + "</td> <td>" +
                            elem.vacantes + "</td> </tr>"
                        );
                        colorearSegunVacantes("#" + elem.id, elem.vacantes);
                        $("#" + elem.id).on("click", mostrarModal); //se activa el modal de cada resultado
                    });
                    if (primera_pagina && data.resultado.length < data.numero_total) { // se pagina el resultado
                        var numero_de_paginas = 0;
                        if (data.numero_total % 5 === 0) { // si en la última página hay 5 resultados exactos
                            numero_de_paginas = data.numero_total / 5;
                        } else if (data.numero_total > 5) { // si en la última página hay menos de 5 resultados
                            numero_de_paginas = Math.ceil(data.numero_total / 5);
                        }
                        $("#paginas").html("<ul class=\"pagination span12\" id=\"lista_paginas\"></ul>"); // se agrega la lista de paginado
                        for (var i = 1; i <= numero_de_paginas; i++) { // por cada página se agrega un número de página distinto
                            if (i === pagina_actual) { // se remarca la página actual (para saber por dónde vamos)
                                $("#lista_paginas").append("<li class=\"active\" id=\"lista_paginas_" + i + "\"><a>" + i + "</a></li>");
                            } else { // las otras páginas no se destacan
                                $("#lista_paginas").append("<li id=\"lista_paginas_" + i + "\"><a>" + i + "</a></li>");
                            } //se pone un link a cada número de página
                            $("#" + "lista_paginas_" + i).on("click", buscar_cursos);
                        }
                        $("#paginas").show(); //se muestra el paginado en la pantalla
                        $("#mensaje_de_informacion").hide(); //se quitan mensajes de usuario
                    }
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                mostrarMensajeDeInformación("danger", "Ha habido un error obteniendo los cursos.");
            }
        });
    }
}

function inscribirse() {
    if (estaLogueado()) {
        $.ajax({
            method: "POST",
            url: "/inscribir",
            data: {
                id_curso: id_curso,
                correo_usuario: usuario
            },
            beforeSend: function(req) {
                req.setRequestHeader("Authorization", "Basic " + btoa(usuario + ":" + password));
            },
            success: function(data, textStatus, jqXHR) {
                mostrarMensajeDeInformación("success", "¡Te acabas de inscribir en el curso " + $("#modal_titulo").text() + "!");
            },
            error: function(jqXHR, textStatus, errorThrown) {
                // Muestra un mensaje de que ya está inscrito porque es el único error que puede llegar hasta aquí.
                // Si no quedasen plazas no habría podido darle al botón de Inscribirse en la página
                mostrarMensajeDeInformación("info", "Ya estás inscrito en el curso " + $("#modal_titulo").text() + ".");
            }
        });
    } else {
        mostrarMensajeDeInformación("info", "Para inscribirte en " + $("#modal_titulo").text() + " debes estar logueado.");
    }
}















/*
    FUNCIONES DE SOPORTE
    ___________________________
*/

function login(email, pass) {
    usuario = email;
    password = pass;
    $("#boton_login").hide();
    $("#boton_logout").show();
    $("#email_usuario").html("&emsp;" + usuario);
    $("#boton_inscribirse").show();
    $("#link_mis_cursos").show();
    abrirMisCursos();
}

function logout() {
    usuario = "";
    $("#boton_login").show();
    $("#boton_logout").hide();
    $("#email_usuario").text("");
    $("#boton_inscribirse").hide();
    $("#link_mis_cursos").hide();
    abrirPortalDeCursos();
}

function estaLogueado() {
    return !estaVacio(usuario);
}

function estaVacio(string) {
    return string.length === 0 || !string.trim()
}

function esFechaValida(fecha) {
    // comprobamos que no está vacía, que de verdad es una fecha y que no es posterior al día de hoy
    return (!estaVacio(fecha) && !isNaN(Date.parse(fecha)) && esAnteriorAHoy(fecha));
}

function isEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function esAnteriorAHoy(fecha) {
    return Date.parse(fecha) < Date.parse(new Date());
}

function esPosteriorAHoy(fecha) {
    return Date.parse(fecha) >= Date.parse(new Date());
}

function colorearSegunVacantes(id_elemento, vacantes) {
    if (vacantes === 1)
        $(id_elemento).addClass("una_vacante");
    else if (vacantes === 0)
        $(id_elemento).addClass("sin_vacantes");
}

function getLunes(d) {
    d = new Date(d);
    var dia_semana = d.getDay(),
        diff = d.getDate() - dia_semana + (dia_semana == 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getDomingo(d) {
    d = new Date(d);
    var dia_semana = d.getDay(),
        diff = d.getDate() - dia_semana + 7;
    return new Date(d.setDate(diff));
}

function sumarDia(fecha, numero_dias) {
    fecha = new Date(fecha);
    var diff = fecha.getDate() + numero_dias;
    return new Date(fecha.setDate(diff));
}

function bajar_semana() {
    margen = margen - 7;
    rellenarDias(margen);
    mostrarTablaHorarios();
    $("#semana_mostrada").text(semana_dias.lunes.toLocaleDateString() + " - " + semana_dias.domingo.toLocaleDateString());
}

function subir_semana() {
    margen = margen + 7;
    rellenarDias(margen);
    mostrarTablaHorarios();
    $("#semana_mostrada").text(semana_dias.lunes.toLocaleDateString() + " - " + semana_dias.domingo.toLocaleDateString());
}

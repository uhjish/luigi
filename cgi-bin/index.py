#!/usr/bin/env python

from mako.template import Template
from mako.lookup import TemplateLookup
from mako import exceptions
import os

import cgi

import cgitb
cgitb.enable()


# CGI header
print "Content-type: text/html\n\n"

def get_required_var(var,form):
    if not form.has_key(var):
        raise Exception("Missing required CGI parameter: %s" % var)
    return form.getvalue(var)

def serve_template(templatename, **kwargs):
    mytemplate = mylookup.get_template(templatename)
    print mytemplate.render(**kwargs)


form = cgi.FieldStorage()

dataUrl = get_required_var("data",form)

mylookup = TemplateLookup(directories=['./'])


######################
serve_template('luigi.tmpl', dataUrl=dataUrl)
######################

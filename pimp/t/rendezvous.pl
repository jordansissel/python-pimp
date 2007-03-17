#!/usr/bin/perl

use strict;

use Net::Rendezvous;

print "starting...\n";
my $r = Net::Rendezvous->new();

$r->application("daap", "tcp");

print "searching...\n";
$r->discover();
print "searching...\n";

while (1) {
	foreach my $entry ($r->entries) {
		printf "%s %s:%s\n", $entry->name, $entry->address, $entry->port;
	}
	print "searching...\n";
	$r->discover();
}

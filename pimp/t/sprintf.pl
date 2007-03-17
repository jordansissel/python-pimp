#!/usr/bin/perl

#use strict;
#use warnings;

my $foo = { "album" => "Album!!!", "artist" => "some artist", "title" => "my title" };

my $x = 0;
while ($x < 1000000) {
	print &sp;
	$x++;
}

$x = 0;
while ($x < 1000000) {
	print &nosp;
	$x++;
}


sub sp {
	return sprintf("(%s) %s - %s\n", $foo->{"album"}, $foo->{"artist"},
					  $foo->{"title"});
}

sub nosp {
	return "(" . $foo->{"album"} . ") " . $foo->{"artist"} . " - " . $foo->{"title"} . "\n";
}
